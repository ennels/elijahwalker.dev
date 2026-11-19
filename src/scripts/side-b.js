// Studio (Side B, SideB.astro): the piece under the mouse or keyboard focus shows large beside the list, and a
// marker slides to its row (motion.css). A click on a row or on the large preview opens the viewer (viewer.js
// handles the rows). Touch skips the preview: a tap opens the viewer straight away. No dependencies.
const root = document.querySelector('[data-sideb]');
if (root) {
  const rows = [...root.querySelectorAll('.trk')];
  const imgs = [...root.querySelectorAll('.pv-img')];
  const bar = root.querySelector('.sideb-mark');
  const pv = root.querySelector('[data-sideb-pv]');
  const pvN = root.querySelector('[data-pv-n]');
  const pvT = root.querySelector('[data-pv-t]');
  const wide = matchMedia('(min-width: 861px)'); // the preview column shows from here up (components.css)
  let cur = 0;
  let placed = false;

  // Slides only from row to row; the first placement, a resize, or a font swap moves it without sliding.
  const place = (still = false) => {
    if (!wide.matches || !rows[cur]) return;
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
    place();
  };

  rows.forEach((r, k) => {
    r.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') show(k); });
    r.addEventListener('focus', () => show(k));
  });
  pv?.addEventListener('click', () => rows[cur].click());
  addEventListener('resize', () => place(true));
  wide.addEventListener('change', () => place(true));
  document.fonts?.ready.then(() => place(true));
  place(true);
}
