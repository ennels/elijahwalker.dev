// Studio (Side B, SideB.astro). Wide screens: the piece under the mouse or keyboard focus shows large beside
// the list. Phones ("now playing"): the preview sticks at the top and shows the row crossing a line 30% of the
// way down the space below it. Either way a marker slides to the active row (motion.css), and a click on a row
// or on the preview opens the viewer (viewer.js handles the rows). No dependencies.
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

  rows.forEach((r, k) => {
    r.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') show(k); });
    r.addEventListener('focus', () => show(k));
  });
  pv?.addEventListener('click', () => rows[cur].click());

  // Now playing (phones): pick the row nearest a line 30% of the way down the space under the stuck preview.
  // Runs on scroll only while Studio is on screen.
  let ticking = false;
  const follow = () => {
    ticking = false;
    if (wide.matches) return;
    const below = pv.getBoundingClientRect().bottom;
    const line = below + (innerHeight - below) * 0.3;
    let best = cur, gap = Infinity;
    rows.forEach((r, k) => {
      const b = r.getBoundingClientRect();
      const d = line < b.top ? b.top - line : line > b.bottom ? line - b.bottom : 0;
      if (d < gap) { gap = d; best = k; }
    });
    show(best);
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(follow); } };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { addEventListener('scroll', onScroll, { passive: true }); follow(); }
    else removeEventListener('scroll', onScroll);
  }).observe(root);
  addEventListener('resize', () => place(true));
  wide.addEventListener('change', () => place(true));
  document.fonts?.ready.then(() => place(true));
  place(true);
}
