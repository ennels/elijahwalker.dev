// Header links.
// - On the homepage, a section link fades the page to its own color, jumps, and fades back in. The address
//   stays elijahwalker.dev: no #section is added. Links to another page keep the page-to-page cross-fade.
// - Arriving from another page with /#section, the hash is dropped once the page has loaded and scrolled there.
// - The link of the section in view is marked (aria-current). One marker element draws the tab under it and
//   slides from link to link (motion.css); without JS, each link draws its own tab.
const root = document.documentElement;
const navLinks = [...document.querySelectorAll('.nav a[href*="#"]')];
const page = (path) => path.replace(/index\.html$/, ''); // /index.html and / are the same page
const target = (a) => (page(a.pathname) === page(location.pathname) ? document.getElementById(a.hash.slice(1)) : null);

const clean = () => {
  if (location.hash && document.getElementById(location.hash.slice(1))) history.replaceState(history.state, '', location.pathname + location.search);
};
if (document.readyState === 'complete') clean(); else addEventListener('load', clean, { once: true });
addEventListener('hashchange', clean);

navLinks.forEach((a) => a.addEventListener('click', (e) => {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const t = target(a);
  if (!t) return;
  e.preventDefault();
  const go = () => {
    t.scrollIntoView(); // honors the header offset (scroll-padding-top)
    t.setAttribute('tabindex', '-1'); // so the next Tab continues from this section
    t.focus({ preventScroll: true });
  };
  if (!document.startViewTransition) return go();
  root.dataset.vt = 'jump';
  document.startViewTransition(go).finished.finally(() => delete root.dataset.vt);
}));

// The marker: placed under the aria-current link. It slides only when the current link changes; on first
// show, resize, or a font swap it moves into place without sliding.
const nav = document.querySelector('.nav');
const bar = nav?.querySelector('.nav-mark');
let shown = null;
const place = (still = false) => {
  if (!bar) return;
  const a = nav.querySelector('a[aria-current]');
  if (!a) { bar.classList.remove('is-on'); shown = null; return; }
  if (a === shown && !still) return;
  const jump = still || !shown;
  if (jump) bar.classList.add('no-slide');
  bar.style.transform = `translateX(${a.offsetLeft}px) scaleX(${a.offsetWidth})`;
  if (jump) { void bar.offsetWidth; bar.classList.remove('no-slide'); }
  bar.classList.add('is-on');
  shown = a;
};
if (bar) {
  nav.classList.add('has-mark');
  addEventListener('resize', () => place(true));
  document.fonts?.ready.then(() => place(true));
}

// Current section: the last one whose top has passed 40% of the way down the window. At the very bottom of
// the page, the last section (Contact is too short to reach that line on tall screens).
const spy = navLinks.map((a) => [a, target(a)]).filter(([, t]) => t);
if (spy.length) {
  let raf = 0;
  let marked; // touch the DOM only when the section changes, not on every scroll frame
  const mark = () => {
    raf = 0;
    const line = innerHeight * 0.4;
    let cur = null;
    for (const [a, t] of spy) if (t.getBoundingClientRect().top <= line) cur = a;
    if (scrollY > 0 && innerHeight + scrollY >= root.scrollHeight - 2) cur = spy.at(-1)[0];
    if (cur === marked) return;
    marked = cur;
    for (const [a] of spy) a === cur ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
    place();
  };
  const queue = () => { raf ||= requestAnimationFrame(mark); };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  mark();
}
place(); // project pages: Projects is marked in the HTML
