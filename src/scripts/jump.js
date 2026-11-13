// Header links to a section on this page: the page fades to its own color, jumps, and fades back in,
// instead of teleporting. Links to another page keep the normal page-to-page cross-fade.
const root = document.documentElement;

document.querySelectorAll('.nav a[href^="/#"]').forEach((a) => a.addEventListener('click', (e) => {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (a.pathname !== location.pathname) return;
  const target = document.getElementById(a.hash.slice(1));
  if (!target || !document.startViewTransition) return; // plain jump
  e.preventDefault();
  root.dataset.vt = 'jump';
  // Setting the hash does the jump the browser would have done: scroll (with the header offset),
  // a history entry, and the focus starting point for the next Tab. An unchanged hash would not scroll.
  const go = () => { if (location.hash === a.hash) target.scrollIntoView(); else location.hash = a.hash; };
  document.startViewTransition(go).finished.finally(() => delete root.dataset.vt);
}));
