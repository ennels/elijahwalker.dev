// Light/dark toggle. Follows the system setting until the visitor picks one; the pick is remembered
// under the same 'ew-mode' key the previous site used, so returning visitors keep their choice.
const root = document.documentElement;
const btn = document.getElementById('modeBtn');
const darkMQ = matchMedia('(prefers-color-scheme: dark)');

const isDark = () => {
  const t = root.dataset.theme;
  return t ? t === 'dark' : darkMQ.matches;
};

function sync() {
  if (!btn) return;
  const dark = isDark();
  btn.dataset.state = dark ? 'dark' : 'light';
  btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
}

btn?.addEventListener('click', () => {
  const next = isDark() ? 'light' : 'dark';
  const apply = () => {
    root.dataset.theme = next;
    try { localStorage.setItem('ew-mode', JSON.stringify(next)); } catch (e) { /* private mode: still switches for this page */ }
    sync();
  };
  // One whole-page cross-fade (opacity only, so it stays on under reduced motion). Instant where unsupported.
  if (!document.startViewTransition) return apply();
  root.dataset.vt = 'theme';
  document.startViewTransition(apply).finished.finally(() => delete root.dataset.vt);
});
darkMQ.addEventListener('change', sync);
sync();
