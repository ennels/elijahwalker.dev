// Homepage behavior: copy-email button and image fallbacks. No dependencies.

// Copy email. Falls back to selecting the address if the clipboard is unavailable.
document.querySelectorAll('[data-copy]').forEach((btn) => {
  const label = btn.textContent;
  btn.addEventListener('click', () => {
    const done = (msg) => { btn.textContent = msg; setTimeout(() => (btn.textContent = label), 1600); };
    const select = () => {
      const el = document.getElementById(btn.getAttribute('aria-controls'));
      if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
      done('Selected. Copy it with your keyboard');
    };
    try { navigator.clipboard.writeText(btn.dataset.copy).then(() => done('Copied'), select); } catch (e) { select(); }
  });
});

// A missing image falls back to its frame text (or, for the headshot, the initials cover).
const drop = (img) => {
  const fallback = img.previousElementSibling;
  if (fallback?.classList.contains('art')) fallback.removeAttribute('aria-hidden'); // the cover monogram stays decorative
  img.remove();
};
document.querySelectorAll('img[data-fallback]').forEach((img) => {
  if (img.complete && img.naturalWidth === 0 && img.currentSrc) drop(img);
  else img.addEventListener('error', () => drop(img), { once: true });
});
