// Homepage behavior: copy-email button and image fallbacks. No dependencies.

// Copy email. The label swaps to "Copied" in place (motion.css) and a status line tells screen readers.
// Falls back to selecting the address if the clipboard is unavailable.
document.querySelectorAll('[data-copy]').forEach((btn) => {
  const word = btn.querySelector('[data-copy-done]');
  const status = btn.parentElement.querySelector('[data-copy-status]');
  let timer = 0;
  const done = (label, msg) => {
    if (word) word.textContent = label;
    btn.classList.add('is-done');
    if (status) { status.textContent = ''; requestAnimationFrame(() => (status.textContent = msg)); } // re-announce on a second click
    clearTimeout(timer);
    timer = setTimeout(() => btn.classList.remove('is-done'), 1600);
  };
  btn.addEventListener('click', () => {
    const select = () => {
      const el = document.getElementById(btn.getAttribute('aria-controls'));
      if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
      done('Selected', 'Email selected. Copy it with your keyboard.');
    };
    try { navigator.clipboard.writeText(btn.dataset.copy).then(() => done('Copied', 'Email copied.'), select); } catch (e) { select(); }
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
