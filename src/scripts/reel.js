// Studio rows: each film row drifts slowly across the window and loops (Digital art left, Photography right).
// A row holds still while the mouse is over it, while keyboard focus is inside it, while it is being dragged,
// while it is off-screen, and while the image viewer is open. The Pause button stops both rows. Dragging or
// swiping sideways scrubs a row. With reduced motion nothing drifts; the row stays a sideways-scrolling strip.
const reels = [...document.querySelectorAll('.reel')];
const toggle = document.querySelector('[data-reel-toggle]');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const HOLE = 24;   // sprocket period in px: each loop is a whole number of holes, so the seam never shows
const PACE = 0.1;  // drift speed, in frame heights per second (about 25 px/s on desktop)
const KEY = 'ew-reels';

if (reels.length && typeof Element.prototype.animate === 'function') {
  let stopped = false;
  try { stopped = localStorage.getItem(KEY) === 'paused'; } catch {}
  const rows = reels.map(makeRow);

  const setStopped = (v) => {
    stopped = v;
    try { v ? localStorage.setItem(KEY, 'paused') : localStorage.removeItem(KEY); } catch {}
    if (toggle) {
      toggle.querySelector('[data-label]').textContent = v ? 'Play motion' : 'Pause motion';
      toggle.dataset.state = v ? 'paused' : 'playing';
    }
    rows.forEach((r) => r.sync());
  };
  toggle?.addEventListener('click', () => setStopped(!stopped));

  const buildAll = () => {
    rows.forEach((r) => r.build());
    if (toggle) toggle.hidden = reduce.matches;
    setStopped(stopped);
  };
  buildAll();
  reduce.addEventListener?.('change', buildAll);
  let lastW = innerWidth, t;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => { if (Math.abs(innerWidth - lastW) > 1) { lastW = innerWidth; rows.forEach((r) => r.build()); } }, 150);
  });

  // Hold every row while the image viewer is open.
  const viewer = document.getElementById('viewer');
  if (viewer) new MutationObserver(() => rows.forEach((r) => r.hold('viewer', viewer.open))).observe(viewer, { attributes: true, attributeFilter: ['open'] });

  function makeRow(el) {
    const track = el.querySelector('.reel-track');
    const originals = [...track.children];
    const dir = el.dataset.dir === 'right' ? 1 : -1;
    const holds = new Set();
    let anim = null, half = 0, dur = 0;

    const setFrac = (f) => { if (anim) anim.currentTime = (((f % 1) + 1) % 1) * dur; };
    const frac = () => (anim ? (anim.currentTime % dur) / dur : 0);
    // Move the film by dx px (positive = to the right), wrapping at the loop.
    const shift = (from, dx) => setFrac(from + (dir < 0 ? -dx : dx) / half);
    // Progress fraction for a translate (px).
    const fAt = (T) => (dir < 0 ? -T / half : (T + half) / half);

    const row = {
      hold(name, on) { on ? holds.add(name) : holds.delete(name); row.sync(); },
      sync() { if (anim) (stopped || holds.size ? anim.pause() : anim.play()); },
      build() {
        const keep = frac();
        anim?.cancel(); anim = null;
        track.querySelectorAll('[data-clone]').forEach((n) => n.remove());
        originals.forEach((li) => li.style.removeProperty('margin-right'));
        el.classList.toggle('is-running', !reduce.matches);
        if (reduce.matches) return;

        // One set of frames, then enough copies that half the track is wider than the window. The track is
        // two identical halves; sliding it by one half and starting over is seamless.
        const setW = track.getBoundingClientRect().width;
        if (!setW) return;
        const per = originals.length;
        const copies = Math.max(1, Math.ceil((innerWidth + 1) / setW));
        const frag = document.createDocumentFragment();
        for (let k = 1; k < copies * 2; k++) originals.forEach((li) => {
          const c = li.cloneNode(true);
          c.dataset.clone = '';
          c.setAttribute('aria-hidden', 'true');
          c.querySelectorAll('a').forEach((a) => (a.tabIndex = -1));
          frag.append(c);
        });
        track.append(frag);
        half = copies * setW;
        const extra = (HOLE - (half % HOLE)) % HOLE;
        if (extra) [copies * per - 1, 2 * copies * per - 1].forEach((i) => (track.children[i].style.marginRight = `calc(var(--film-gap) + ${extra}px)`));
        half += extra;

        const h = originals[0].querySelector('.pic').getBoundingClientRect().height || 200;
        dur = (half / (h * PACE)) * 1000;
        const a = `translateX(0px)`, b = `translateX(${-half}px)`;
        anim = track.animate(dir < 0 ? [{ transform: a }, { transform: b }] : [{ transform: b }, { transform: a }], { duration: dur, iterations: Infinity });
        setFrac(keep);
        row.sync();
      },
    };

    // Mouse over the row holds it.
    el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') row.hold('hover', true); });
    el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') row.hold('hover', false); });

    // Keyboard focus holds the row and brings the focused frame into view (the row clips; it cannot scroll).
    el.addEventListener('focusin', (e) => {
      if (!e.target.matches(':focus-visible')) return; // focus put back after a mouse click doesn't hold the row
      row.hold('focus', true);
      const li = e.target.closest('.frame');
      if (!anim || !li || li.dataset.clone !== undefined) return;
      const box = el.getBoundingClientRect(), r = li.getBoundingClientRect();
      if (r.left >= box.left && r.right <= box.right) return;
      const L = li.offsetLeft; // position in the untransformed track
      const T = Math.min(-0.5, (box.width - r.width) / 2 - L); // center it if possible, else start of the row
      setFrac(Math.min(0.9999, Math.max(0, fAt(Math.max(-half + 0.5, T)))));
    });
    el.addEventListener('focusout', (e) => { if (!el.contains(e.relatedTarget)) row.hold('focus', false); });

    // Drag or swipe sideways to scrub. Vertical swipes still scroll the page (touch-action: pan-y).
    let drag = null, dragged = false;
    el.addEventListener('pointerdown', (e) => {
      if (!anim || e.button !== 0) return;
      dragged = false;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, f: frac(), on: false };
    });
    el.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.on) {
        if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) return;
        drag.on = true;
        try { el.setPointerCapture(e.pointerId); } catch {}
        el.classList.add('is-dragging');
        row.hold('drag', true);
      }
      shift(drag.f, dx);
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      dragged = drag.on;
      drag = null;
      el.classList.remove('is-dragging');
      row.hold('drag', false);
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('click', (e) => { if (dragged) { dragged = false; e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    el.addEventListener('dragstart', (e) => e.preventDefault());

    // Off-screen rows hold still.
    new IntersectionObserver(([en]) => row.hold('off', !en.isIntersecting)).observe(el);
    return row;
  }
}
