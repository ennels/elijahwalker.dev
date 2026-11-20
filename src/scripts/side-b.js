// Studio (Side B, SideB.astro): "now playing". Scrolling plays the row at a line in the large preview: on wide
// screens the line is where the middle of the stuck preview sits beside the list; on phones, where the preview
// sticks above the list, it sits 30% of the way down the space below it. Moving the mouse over a row shows that
// row until the next scroll; a row with keyboard focus holds the preview. A marker slides to the active row and
// the other titles dim (motion.css). A click on a row or on the preview opens the viewer (viewer.js handles the
// rows). No dependencies.
const root = document.querySelector('[data-sideb]');
if (root) {
  const rows = [...root.querySelectorAll('.trk')];
  const imgs = [...root.querySelectorAll('.pv-img')];
  const bar = root.querySelector('.sideb-mark');
  const pv = root.querySelector('[data-sideb-pv]');
  const pvN = root.querySelector('[data-pv-n]');
  const pvT = root.querySelector('[data-pv-t]');
  const pvName = root.querySelector('[data-pv-name]');
  const wide = matchMedia('(min-width: 861px)'); // side-by-side from here up; below, now playing (components.css)
  let cur = 0;
  let placed = false;

  // Slides only from row to row; the first placement, a resize, or a font swap moves it without sliding.
  const place = (still = false) => {
    if (!rows[cur]) return;
    const r = rows[cur];
    const jump = still || !placed;
    if (jump) bar.classList.add('no-slide');
    bar.style.transform = `translateY(${r.offsetTop}px) scaleY(${r.offsetHeight})`;
    if (jump) { void bar.offsetWidth; bar.classList.remove('no-slide'); }
    bar.classList.add('is-on');
    placed = true;
  };

  const show = (k) => {
    if (k === cur) return;
    rows[cur].classList.remove('is-active');
    imgs[cur]?.classList.remove('is-on');
    cur = k;
    rows[cur].classList.add('is-active');
    imgs[cur]?.classList.add('is-on');
    pvN.textContent = `B${k + 1} · ${rows[k].closest('[data-group]')?.dataset.group ?? ''}`;
    pvT.textContent = rows[k].dataset.alt ?? '';
    if (pvName) pvName.textContent = rows[k].dataset.caption ?? '';
    place();
  };

  // Mouse: only real movement counts. Rows sliding under a still pointer while the page scrolls must not
  // take the preview from the scroll, so pointer events right after a scroll are ignored.
  let lastScroll = 0;
  rows.forEach((r, k) => {
    r.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch' || performance.now() - lastScroll < 200 || (!e.movementX && !e.movementY)) return;
      show(k);
    });
    r.addEventListener('focus', () => show(k));
  });
  root.classList.add('is-live'); // turns on the dimming of the other rows (components.css)
  pv?.addEventListener('click', () => rows[cur].click());

  // Now playing: pick the row nearest the line. Runs on scroll only while Studio is on screen, and not while a
  // row has keyboard focus (tabbing scrolls the page too).
  let ticking = false;
  const box = root.querySelector('.pv-box');
  const follow = () => {
    ticking = false;
    if (document.activeElement?.matches?.('.trk:focus-visible')) return;
    let line;
    // Wide: a fixed line where the middle of the preview sits while it is stuck, so the last rows still play
    // after the preview has scrolled on.
    if (wide.matches) line = parseFloat(getComputedStyle(pv).top) + box.offsetHeight / 2;
    else { const below = pv.getBoundingClientRect().bottom; line = below + (innerHeight - below) * 0.3; }
    let best = cur, gap = Infinity;
    rows.forEach((r, k) => {
      const b = r.getBoundingClientRect();
      const d = line < b.top ? b.top - line : line > b.bottom ? line - b.bottom : 0;
      if (d < gap) { gap = d; best = k; }
    });
    show(best);
  };
  const onScroll = () => { lastScroll = performance.now(); if (!ticking) { ticking = true; requestAnimationFrame(follow); } };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { addEventListener('scroll', onScroll, { passive: true }); follow(); }
    else removeEventListener('scroll', onScroll);
  }).observe(root);
  addEventListener('resize', () => place(true));
  wide.addEventListener('change', () => place(true));
  document.fonts?.ready.then(() => place(true));
  place(true);
}
