// Studio image viewer. A linked frame opens its image in a modal instead of leaving the page.
// Close: the × button, Esc, a click outside the image, or the browser/phone Back button.
// Move: arrow buttons, arrow keys, or a sideways swipe; it runs through every linked frame and wraps.
// The thumbnail shows at once and the full image replaces it when decoded. Focus returns to the frame.
const dlg = document.getElementById('viewer');
const links = [...document.querySelectorAll('a.pic[href]')];

if (dlg && links.length && typeof dlg.showModal === 'function') {
  const img = dlg.querySelector('.lb-img');
  const cap = dlg.querySelector('.lb-cap');
  const count = dlg.querySelector('.lb-count');

  // Each strip is labeled (Drawings, Photographs); numbering restarts per group.
  const items = links.map((link) => {
    const thumb = link.querySelector('img');
    const group = link.closest('.strips')?.closest('.roll')?.querySelector('h3')?.textContent ?? '';
    return { link, thumb, group, full: link.getAttribute('href'), title: thumb?.alt ?? '' };
  });
  items.forEach((it) => {
    const same = items.filter((x) => x.group === it.group);
    it.n = same.indexOf(it) + 1;
    it.of = same.length;
  });

  let idx = 0;
  let pushed = false; // whether this viewer added the history entry that Back removes

  const preload = (it) => { const i = new Image(); i.src = it.full; return i; };

  const show = (i) => {
    idx = (i + items.length) % items.length;
    const it = items[idx];
    const ar = getComputedStyle(it.link.closest('.frame')).getPropertyValue('--ar').trim() || '1';
    dlg.style.setProperty('--ar', ar); // sizes the box before any image arrives, so nothing jumps
    img.alt = it.title;
    img.src = it.thumb?.currentSrc || it.thumb?.src || it.full;
    cap.textContent = it.title;
    count.textContent = it.group ? `${it.group} · ${it.n} of ${it.of}` : `${it.n} of ${it.of}`;
    const full = preload(it);
    full.decode().then(() => { if (items[idx] === it) img.src = it.full; }, () => {});
    preload(items[(idx + 1) % items.length]);
  };

  const open = (i) => {
    show(i);
    dlg.showModal();
    history.pushState({ viewer: true }, '');
    pushed = true;
  };

  // Every close goes through history, so Back and the × button end in the same place.
  const requestClose = () => { if (pushed) history.back(); else finish(); };
  const finish = () => {
    pushed = false;
    if (dlg.open) dlg.close();
  };
  dlg.addEventListener('close', () => {
    const link = items[idx].link;
    link.focus({ preventScroll: true });
    const r = link.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) link.scrollIntoView({ block: 'center' });
  });
  addEventListener('popstate', () => { if (dlg.open) finish(); else pushed = false; });

  links.forEach((link, i) => link.addEventListener('click', (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab still works
    e.preventDefault();
    open(i);
  }));

  dlg.addEventListener('cancel', (e) => { e.preventDefault(); requestClose(); }); // Esc
  dlg.addEventListener('click', (e) => {
    const step = e.target.closest('[data-lb-step]');
    if (step) return show(idx + Number(step.dataset.lbStep));
    if (e.target.closest('[data-lb-close]') || !e.target.closest('.lb-img, .lb-top, .lb-cap')) requestClose();
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
  });

  // Sideways swipe on touch screens; vertical drags and pinches are left alone.
  let start = null;
  dlg.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') start = { x: e.clientX, y: e.clientY }; });
  dlg.addEventListener('pointerup', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      dlg.dataset.swiped = '1'; // the click that follows a swipe must not close the viewer
      show(idx + (dx < 0 ? 1 : -1));
    }
  });
  dlg.addEventListener('pointercancel', () => (start = null));
  dlg.addEventListener('click', (e) => {
    if (dlg.dataset.swiped) { delete dlg.dataset.swiped; e.stopImmediatePropagation(); }
  }, { capture: true });
}
