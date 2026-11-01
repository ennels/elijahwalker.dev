(() => {
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const reduce = () => reduceMQ.matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const darkMQ = matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => {
    if (root.classList.contains('mode-dark')) return true;
    if (root.classList.contains('mode-light')) return false;
    const t = root.getAttribute('data-theme');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return darkMQ.matches;
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  /* Section list comes from the page itself (see src/pages/index.astro), so planets always match the sections. */
  const SECT = [...document.querySelectorAll('main .sec')].map((el) => ({
    id: el.id, name: el.dataset.name, color: el.dataset.color, cname: el.dataset.cname, teaser: el.dataset.teaser,
  }));
  let raf = 0, last = 0;
  const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } };

  /* ---------- theme ---------- */
  const themeBtn = $('themeBtn');
  const savedMode = store.get('ew-mode', null);
  if (savedMode === 'dark' || savedMode === 'light') root.classList.add('mode-' + savedMode);
  function syncTheme() {
    const d = isDark();
    themeBtn.dataset.state = d ? 'dark' : 'light';
    themeBtn.setAttribute('aria-label', d ? 'Switch to light mode' : 'Switch to dark mode');
    kick();
  }
  themeBtn.addEventListener('click', () => {
    const d = !isDark();
    root.classList.remove('mode-dark', 'mode-light');
    root.classList.add(d ? 'mode-dark' : 'mode-light');
    store.set('ew-mode', d ? 'dark' : 'light');
    syncTheme();
  });
  darkMQ.addEventListener('change', syncTheme);
  new MutationObserver(syncTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---------- sections: lock state ---------- */
  const nav = $('nav'), menu = $('menu'), burger = $('burger'), hero = $('top'), copy = $('heroCopy');
  const links = [...menu.querySelectorAll('a')];
  const secs = SECT.map((s) => $(s.id));
  const isOpen = (i) => !secs[i].classList.contains('locked');
  function paintSection(i) {
    const s = SECT[i], el = secs[i], open = isOpen(i), link = links[i];
    el.querySelector('.inner').inert = !open;
    const st = el.querySelector('.st');
    if (open) st.textContent = 'Open';
    else {
      const tz = document.createElement('span'); tz.className = 'tz'; tz.textContent = ' · ' + s.teaser;
      st.textContent = 'Locked'; st.append(tz, ' · hit the ' + s.cname + ' planet to open');
    }
    el.querySelector('.skip').hidden = open;
    link.classList.toggle('locked', !open);
    link.classList.toggle('open-sec', open);
    link.style.setProperty('--dot', s.color);
    link.setAttribute('aria-label', s.name + (open ? '' : ' (locked)'));
  }
  function unlock(i) {
    if (isOpen(i)) return false;
    secs[i].classList.remove('locked');
    paintSection(i);
    store.set('ew-open', SECT.map((_, k) => isOpen(k)));
    syncHud(); kick();
    return true;
  }
  const opened = store.get('ew-open', null);
  document.body.classList.add('no-anim');
  SECT.forEach((_, i) => { if (Array.isArray(opened) && opened[i]) secs[i].classList.remove('locked'); paintSection(i); });
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('no-anim')));

  function goTo(i, card) {
    const target = card && isOpen(i) ? $(card) : secs[i];
    target.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' });
    const h = secs[i].querySelector('h2');
    setTimeout(() => h.focus({ preventScroll: true }), reduce() ? 0 : 700);
  }
  function unlockAll() {
    SECT.forEach((_, i) => unlock(i));
    status('Every section is open. The game still keeps score if you want to play.');
    goTo(0);
  }
  document.querySelectorAll('.skip-all').forEach((b) => b.addEventListener('click', unlockAll));

  /* ---------- nav ---------- */
  function setMenu(open) {
    menu.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    onScroll();
  }
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); } });
  addEventListener('resize', () => { if (innerWidth > 1000 && menu.classList.contains('open')) setMenu(false); });
  let heroVis = true;
  function onScroll() {
    const hH = hero.offsetHeight;
    const solid = scrollY > hH - nav.offsetHeight - 8 || menu.classList.contains('open');
    nav.classList.toggle('solid', solid);
    nav.classList.toggle('glass', !solid && scrollY > 24);
    let cur = -1;
    secs.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) cur = i; });
    links.forEach((a, i) => { a.classList.toggle('on', i === cur); if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    if (!reduce() && scrollY < hH) {
      copy.style.transform = 'translate3d(0,' + (scrollY * 0.3).toFixed(1) + 'px,0)';
      copy.style.opacity = String(clamp(1 - scrollY / (hH * 0.42), 0, 1));
    } else if (reduce()) { copy.style.transform = ''; copy.style.opacity = ''; }
    kick();
  }
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); } }, { passive: true });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-scroll]');
    if (!a) return;
    const href = a.getAttribute('href');
    e.preventDefault();
    setMenu(false);
    const i = SECT.findIndex((s) => '#' + s.id === href);
    if (i >= 0) { goTo(i, a.dataset.card); return; }
    const t = document.querySelector(href);
    if (t) t.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' });
  });

  /* ---------- copy + pdf ---------- */
  $('copyBtn').addEventListener('click', () => {
    const btn = $('copyBtn'), text = $('email').textContent;
    const done = (m) => { btn.textContent = m; setTimeout(() => (btn.textContent = 'Copy address'), 1600); };
    const select = () => { const r = document.createRange(); r.selectNodeContents($('email')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); done('Selected, press Ctrl+C'); };
    try { navigator.clipboard.writeText(text).then(() => done('Copied'), select); } catch (e) { select(); }
  });

  /* ---------- shared drawing helpers ---------- */
  let dpr = Math.min(2, devicePixelRatio || 1);
  function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
  function starImg(w, h, n, seed, rMin, rMax, aMin) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * dpr)); c.height = Math.max(1, Math.round(h * dpr));
    const s = c.getContext('2d'); s.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      const m = r(); s.fillStyle = r() < 0.25 ? '#FFD9B8' : '#FFF4EC';
      s.globalAlpha = aMin + m * (1 - aMin);
      s.beginPath(); s.arc(r() * w, r() * h, rMin + m * (rMax - rMin), 0, 7); s.fill();
    }
    return c;
  }
  function meteorStep(list, dt, w, h, spawnIn) {
    if (reduce()) { list.length = 0; return spawnIn; }
    spawnIn -= dt;
    if (spawnIn <= 0) {
      const fast = 520 + Math.random() * 380;
      list.push({ x: w * (0.35 + Math.random() * 0.75), y: h * Math.random() * 0.45, vx: -fast, vy: fast * (0.32 + Math.random() * 0.2), life: 0.55 + Math.random() * 0.35, max: 0 });
      list[list.length - 1].max = list[list.length - 1].life;
      spawnIn = 2.5 + Math.random() * 5.5;
    }
    for (let i = list.length - 1; i >= 0; i--) { const m = list[i]; m.life -= dt; m.x += m.vx * dt; m.y += m.vy * dt; if (m.life <= 0) list.splice(i, 1); }
    return spawnIn;
  }
  function meteorDraw(c, list) {
    c.lineCap = 'round';
    for (const m of list) {
      const a = clamp(m.life / m.max, 0, 1), tx = m.x - m.vx * 0.13, ty = m.y - m.vy * 0.13;
      const lg = c.createLinearGradient(tx, ty, m.x, m.y);
      lg.addColorStop(0, 'rgba(255,236,214,0)'); lg.addColorStop(1, 'rgba(255,240,224,' + (0.9 * a) + ')');
      c.strokeStyle = lg; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(tx, ty); c.lineTo(m.x, m.y); c.stroke();
    }
  }

  /* ---------- hero game ---------- */
  const cv = $('heroCv'), g = cv.getContext('2d');
  let W = 0, H = 0, S = 1, ox = 0, oy0 = 0, oy = 0, layers = [];
  const PAR = { far: 0.8, mid: 0.55, near: 0.3, glow: 0.62, system: 0.45 };
  const bodies = SECT.map((s, i) => ({ i, name: s.name, color: s.color, a: 0.26 + i * 0.11, rad: 0.03 + (i % 3) * 0.006 }));
  bodies.forEach((b) => (b.w = 0.26 * Math.pow(0.26 / b.a, 1.5)));
  const TH = Float64Array.from(bodies.map((b, i) => 0.8 + i * 2.39996));
  const GM = 0.32, GMP = 0.003, SUN = 0.075, PAD = { x: 0.96, y: 0.94 }, MAXT = 20, STEP = 1 / 240;
  let probe = null, aim = null, launches = 0, score = 0, misses = 0, accT = 0, heroMeteors = [], heroSpawn = 3, pops = [];
  const runHits = new Set();
  let best = store.get('ew-best', 0);

  function buildHero() {
    const r = cv.getBoundingClientRect();
    W = r.width; H = r.height; dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.max(1, Math.round(W * dpr)); cv.height = Math.max(1, Math.round(H * dpr));
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const area = W * H;
    layers = [
      { img: starImg(W, H, Math.round(area / 900), 31, 0.4, 0.8, 0.2), k: PAR.far },
      { img: starImg(W, H, Math.round(area / 3200), 47, 0.7, 1.2, 0.35), k: PAR.mid },
      { img: starImg(W, H, Math.round(area / 14000), 59, 1.1, 1.9, 0.5), k: PAR.near },
    ];
    const narrow = W < 760;
    S = narrow ? Math.min(H * 0.18, W * 0.36) : Math.min(H * 0.4, W * 0.25);
    ox = narrow ? W * 0.5 : W * 0.7;
    oy0 = narrow ? H * 0.655 : H * 0.53;
    oy = oy0;
  }
  const X = (x) => ox + x * S, Y = (y) => oy + y * S;
  const bodyR = (b) => Math.max(5 / S, b.rad);
  const hitR = (b) => bodyR(b) + 0.035;
  const sunR = () => Math.max(SUN, 9 / S);
  const posAt = (b, th) => ({ x: b.a * Math.cos(th[b.i]), y: b.a * Math.sin(th[b.i]) });
  function accel(x, y, th) {
    const r2 = x * x + y * y, r = Math.sqrt(r2), k = -GM / (r2 * r); let ax = k * x, ay = k * y;
    for (const b of bodies) { const p = posAt(b, th), dx = p.x - x, dy = p.y - y, d2 = dx * dx + dy * dy + 0.0006, d = Math.sqrt(d2); ax += (GMP * dx) / (d2 * d); ay += (GMP * dy) / (d2 * d); }
    return [ax, ay];
  }
  function collide(x, y, th) {
    const sr = sunR();
    if (x * x + y * y < sr * sr) return { type: 'sun' };
    for (const b of bodies) { const p = posAt(b, th), rr = hitR(b); if ((p.x - x) ** 2 + (p.y - y) ** 2 < rr * rr) return { type: 'body', b }; }
    const sx = X(x), sy = Y(y);
    if (sx < -30 || sx > W + 30 || sy < -30 || sy > H + 30) return { type: 'lost' };
    return null;
  }
  function vel(t) { const dx = t.x - PAD.x, dy = t.y - PAD.y, d = Math.hypot(dx, dy) || 1, v = Math.min(1.2, Math.max(0.25, d * 0.55)); return [(dx / d) * v, (dy / d) * v, v]; }
  const advance = (th, h) => { if (!reduce()) for (const b of bodies) th[b.i] += b.w * h; };
  function predict() {
    const th = Float64Array.from(TH); let [vx, vy] = vel(aim), x = PAD.x, y = PAD.y; const pts = [];
    let end = null;
    for (let i = 0; i < 720; i++) {
      advance(th, STEP);
      const [ax, ay] = accel(x, y, th);
      vx += ax * STEP; vy += ay * STEP; x += vx * STEP; y += vy * STEP;
      if (i % 6 === 0) pts.push(x, y);
      const res = collide(x, y, th);
      if (res) { pts.push(x, y); if (res.type === 'body') end = { b: res.b, p: posAt(res.b, th) }; break; }
    }
    return { pts, end };
  }

  const status = (t) => ($('cStatus').textContent = t);
  function syncHud() {
    $('cScore').textContent = score.toLocaleString();
    $('cOpen').textContent = SECT.filter((_, i) => isOpen(i)).length + '/7';
    $('cLaunch').textContent = String(launches);
    $('pillScore').textContent = score.toLocaleString();
    $('backOrbit').hidden = !(launches > 0 && !heroVis);
  }
  function launch(t) {
    if (probe && probe.mode === 'fly') return;
    const [vx, vy] = vel(t);
    probe = { x: PAD.x, y: PAD.y, vx, vy, t: 0, mode: 'fly', trail: [PAD.x, PAD.y], tAcc: 0, near: new Set() };
    launches++; accT = 0;
    status('Coasting…'); syncHud(); kick();
  }
  function arrive(b) {
    const p = posAt(b, TH);
    Object.assign(probe, { mode: 'docked', body: b, dx: probe.x - p.x, dy: probe.y - p.y, timer: 1.6 });
    const first = !runHits.has(b.i);
    let pts = first ? 100 : 25; const why = [];
    if (first && misses === 0) { pts += 50; why.push('clean shot'); }
    const assists = [...probe.near].filter((j) => j !== b.i).length;
    if (assists) { pts += 75 * Math.min(2, assists); why.push('gravity assist'); }
    runHits.add(b.i); misses = 0;
    if (first && runHits.size === 7) { pts += 500; why.push('grand tour'); }
    score += pts;
    if (score > best) { best = score; store.set('ew-best', best); }
    pops.push({ b, text: '+' + pts, sub: why.join(' · '), life: 1.8 });
    const opened = unlock(b.i);
    status(b.name + (opened ? ' unlocked. ' : '. ') + '+' + pts + (why.length ? ' for ' + why.join(' and ') : '') + '. Taking you there…');
    syncHud();
    setTimeout(() => { goTo(b.i); status('Scroll back up or use "Back to orbit" to keep playing. Best score: ' + best.toLocaleString() + '.'); }, reduce() ? 300 : 1100);
  }
  function crash(type) {
    probe.mode = 'dead'; probe.timer = type === 'sun' ? 1.1 : 0.6; misses++;
    status(type === 'sun' ? 'Burned up near the star. Aim wider so the star bends your path instead of catching it.' : 'Lost the probe off-screen. Aim closer to a planet or launch slower.');
  }
  function simStep(h) {
    advance(TH, h);
    if (!probe || probe.mode !== 'fly') return;
    const [ax, ay] = accel(probe.x, probe.y, TH);
    probe.vx += ax * h; probe.vy += ay * h; probe.x += probe.vx * h; probe.y += probe.vy * h; probe.t += h;
    for (const b of bodies) { const p = posAt(b, TH); if ((p.x - probe.x) ** 2 + (p.y - probe.y) ** 2 < (hitR(b) + 0.1) ** 2) probe.near.add(b.i); }
    probe.tAcc += h;
    if (probe.tAcc >= 1 / 60) { probe.trail.push(probe.x, probe.y); probe.tAcc = 0; if (probe.trail.length > 900) probe.trail.splice(0, 2); }
    const res = collide(probe.x, probe.y, TH) || (probe.t > MAXT ? { type: 'lost' } : null);
    if (res) { if (res.type === 'body') arrive(res.b); else crash(res.type); }
  }
  function stepHero(dt) {
    accT += dt;
    let n = 0;
    while (accT >= STEP && n < 60) { simStep(STEP); accT -= STEP; n++; }
    if (n === 60) accT = 0;
    if (probe && probe.mode !== 'fly') {
      probe.timer -= dt;
      if (probe.mode === 'docked') { const p = posAt(probe.body, TH); probe.x = p.x + probe.dx; probe.y = p.y + probe.dy; }
      if (probe.timer <= 0) { probe = null; if (!/Taking you|Scroll back/.test($('cStatus').textContent)) status('Ready on the pad. Click the sky to launch.'); }
    }
    for (let i = pops.length - 1; i >= 0; i--) { pops[i].life -= dt; if (pops[i].life <= 0) pops.splice(i, 1); }
    heroSpawn = meteorStep(heroMeteors, dt, W, H, heroSpawn);
  }
  function drawHero() {
    if (!W) return;
    const dark = isDark(), so = reduce() ? 0 : clamp(scrollY, 0, H);
    oy = oy0 + so * PAR.system;
    let gr = g.createLinearGradient(0, 0, 0, H);
    if (dark) { gr.addColorStop(0, '#07060E'); gr.addColorStop(1, '#160A16'); }
    else { gr.addColorStop(0, '#1B1238'); gr.addColorStop(0.6, '#3A1D44'); gr.addColorStop(1, '#6E2D3C'); }
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.globalAlpha = dark ? 1 : 0.72;
    for (const L of layers) { const off = (so * L.k) % H; g.drawImage(L.img, 0, off, W, H); g.drawImage(L.img, 0, off - H, W, H); }
    g.globalAlpha = 1;
    meteorDraw(g, heroMeteors);
    g.globalCompositeOperation = 'lighter';
    const gy = oy0 + so * PAR.glow;
    gr = g.createRadialGradient(ox, gy, 0, ox, gy, Math.max(S * 1.6, 260));
    gr.addColorStop(0, dark ? 'rgba(255,150,80,.3)' : 'rgba(255,170,100,.42)');
    gr.addColorStop(0.35, 'rgba(220,80,110,.13)'); gr.addColorStop(1, 'rgba(120,50,140,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = 'rgba(255,236,220,.13)'; g.lineWidth = 1;
    for (const b of bodies) { g.beginPath(); g.arc(ox, oy, b.a * S, 0, 7); g.stroke(); }
    const sr = sunR() * S;
    gr = g.createRadialGradient(ox, oy - sr * 0.3, 0, ox, oy, sr);
    gr.addColorStop(0, '#FFF1C9'); gr.addColorStop(0.55, '#FFB25C'); gr.addColorStop(1, '#E8573A');
    g.fillStyle = gr; g.beginPath(); g.arc(ox, oy, sr, 0, 7); g.fill();

    const ready = !(probe && probe.mode === 'fly');
    if (aim && ready) {
      const { pts, end } = predict();
      g.fillStyle = '#FFD59A';
      for (let i = 0; i < pts.length; i += 2) { g.globalAlpha = 0.95 * (1 - (i / pts.length) * 0.75); g.fillRect(X(pts[i]) - 1, Y(pts[i + 1]) - 1, 2, 2); }
      g.globalAlpha = 1;
      if (end) {
        g.setLineDash([3, 3]); g.strokeStyle = end.b.color; g.lineWidth = 1.2;
        g.beginPath(); g.arc(X(end.p.x), Y(end.p.y), bodyR(end.b) * S + 5, 0, 7); g.stroke();
        g.setLineDash([]); g.lineWidth = 1;
      }
    }
    if (probe && probe.trail.length > 2) {
      g.strokeStyle = '#FFD59A'; g.globalAlpha = probe.mode === 'fly' ? 0.9 : 0.4; g.lineWidth = 1.3;
      g.beginPath(); g.moveTo(X(probe.trail[0]), Y(probe.trail[1]));
      for (let i = 2; i < probe.trail.length; i += 2) g.lineTo(X(probe.trail[i]), Y(probe.trail[i + 1]));
      g.lineTo(X(probe.x), Y(probe.y));
      g.stroke(); g.globalAlpha = 1; g.lineWidth = 1;
    }
    g.font = '500 11px "JetBrains Mono", ui-monospace, monospace'; g.textBaseline = 'middle';
    for (const b of bodies) {
      const p = posAt(b, TH), bx = X(p.x), by = Y(p.y), R = bodyR(b) * S;
      g.fillStyle = b.color; g.beginPath(); g.arc(bx, by, R, 0, 7); g.fill();
      if (isOpen(b.i)) { g.strokeStyle = 'rgba(255,231,194,.85)'; g.lineWidth = 1.4; g.beginPath(); g.arc(bx, by, R + 4, 0, 7); g.stroke(); g.lineWidth = 1; }
      const ux = p.x / b.a, uy = p.y / b.a;
      g.textAlign = ux > 0.35 ? 'left' : ux < -0.35 ? 'right' : 'center';
      g.fillStyle = isOpen(b.i) ? '#FFF4EC' : 'rgba(255,236,220,.68)';
      g.fillText(b.name.toUpperCase(), bx + ux * (R + 8), by + uy * (R + 8) + (Math.abs(ux) <= 0.35 ? (uy > 0 ? 5 : -5) : 0));
    }
    const px = X(PAD.x), py = Y(PAD.y);
    g.strokeStyle = '#FFF4EC'; g.beginPath(); g.moveTo(px - 8, py + 7); g.lineTo(px + 8, py + 7); g.stroke();
    if (ready && !(probe && probe.mode === 'docked')) { g.fillStyle = '#FFF4EC'; g.beginPath(); g.moveTo(px, py - 8); g.lineTo(px + 4, py + 4); g.lineTo(px - 4, py + 4); g.closePath(); g.fill(); }
    g.textAlign = 'right'; g.fillStyle = 'rgba(255,236,220,.72)'; g.fillText('PAD', px - 12, py + 1);
    if (probe) { g.save(); g.translate(X(probe.x), Y(probe.y)); g.rotate(Math.PI / 4); g.fillStyle = probe.mode === 'dead' ? '#FF7A59' : '#FFFFFF'; g.fillRect(-3.5, -3.5, 7, 7); g.restore(); }
    if (aim && ready) { g.strokeStyle = '#FFD59A'; g.beginPath(); g.arc(X(aim.x), Y(aim.y), 7, 0, 7); g.stroke(); }
    for (const pp of pops) {
      const p = posAt(pp.b, TH), a = clamp(pp.life / 1.8, 0, 1), rise = (1.8 - pp.life) * 26;
      g.globalAlpha = a; g.textAlign = 'center';
      g.font = '800 20px Montserrat, system-ui, sans-serif'; g.fillStyle = '#FFE7C2';
      g.fillText(pp.text, X(p.x), Y(p.y) - 22 - rise);
      if (pp.sub) { g.font = '500 11px "JetBrains Mono", ui-monospace, monospace'; g.fillStyle = '#FFF4EC'; g.fillText(pp.sub.toUpperCase(), X(p.x), Y(p.y) - 4 - rise); }
      g.globalAlpha = 1;
    }
  }
  const toN = (e) => ({ x: (e.offsetX - ox) / S, y: (e.offsetY - oy) / S });
  cv.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { aim = toN(e); kick(); } });
  cv.addEventListener('pointerleave', () => { aim = null; kick(); });
  cv.addEventListener('pointerup', (e) => { if (e.button !== 0 && e.pointerType === 'mouse') return; launch(toN(e)); });
  $('cNew').addEventListener('click', () => {
    probe = null; launches = 0; score = 0; misses = 0; runHits.clear(); pops = []; accT = 0;
    status('New game. Each planet scores once per game, and the sections you have opened stay open.'); syncHud(); kick();
  });
  $('backOrbit').addEventListener('click', () => { hero.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' }); });
  if (coarse) status('Each planet unlocks a section. Tap the sky to launch from the pad and bend your path around the star.');

  /* ---------- section gates: parallax stars, planet, meteors ---------- */
  const gates = secs.map((el, i) => {
    const c = el.querySelector('.gate canvas');
    return { el: el.querySelector('.gate'), i, cv: c, g: c.getContext('2d'), W: 0, H: 0, imgW: 0, imgs: null, meteors: [], spawn: 1.5 + Math.random() * 6, vis: false };
  });
  function sizeGate(G) {
    const r = G.cv.getBoundingClientRect();
    G.W = r.width; G.H = r.height;
    G.cv.width = Math.max(1, Math.round(G.W * dpr)); G.cv.height = Math.max(1, Math.round(G.H * dpr));
    G.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (G.imgW !== Math.round(G.W)) {
      G.imgW = Math.round(G.W);
      G.imgs = [starImg(G.W, 200, Math.round((G.W * 200) / 1100), 100 + G.i, 0.4, 0.9, 0.25), starImg(G.W, 200, Math.round((G.W * 200) / 5200), 200 + G.i, 0.8, 1.6, 0.45)];
    }
  }
  function drawGate(G, dt) {
    if (!G.W) sizeGate(G);
    const c = G.g, W2 = G.W, H2 = G.H, rect = G.el.getBoundingClientRect();
    const p = reduce() ? 0 : rect.top + rect.height / 2 - innerHeight / 2;
    c.fillStyle = '#0A0712'; c.fillRect(0, 0, W2, H2);
    [0.1, 0.24].forEach((k, li) => { const off = (((p * k) % 200) + 200) % 200; c.drawImage(G.imgs[li], 0, off - 200, W2, 200); c.drawImage(G.imgs[li], 0, off, W2, 200); });
    if (dt) G.spawn = meteorStep(G.meteors, dt, W2, H2, G.spawn);
    meteorDraw(c, G.meteors);
    const col = SECT[G.i].color, R = Math.max(96, 172 * 0.95);
    const px = W2 * (W2 < 560 ? 0.92 : 0.84) - p * 0.03, py = H2 + R * 0.42 + p * 0.14;
    let gr = c.createRadialGradient(px, py - R * 0.6, 0, px, py - R * 0.6, R * 1.6);
    gr.addColorStop(0, 'rgba(255,170,100,.22)'); gr.addColorStop(1, 'rgba(255,120,90,0)');
    c.fillStyle = gr; c.fillRect(0, 0, W2, H2);
    gr = c.createRadialGradient(px - R * 0.35, py - R * 0.45, R * 0.05, px, py, R);
    gr.addColorStop(0, col); gr.addColorStop(0.7, col); gr.addColorStop(1, '#1A0F1F');
    c.fillStyle = gr; c.beginPath(); c.arc(px, py, R, 0, 7); c.fill();
    c.strokeStyle = col; c.globalAlpha = 0.45; c.lineWidth = 3; c.beginPath(); c.arc(px, py, R + 4, 0, 7); c.stroke(); c.globalAlpha = 1; c.lineWidth = 1;
    c.strokeStyle = 'rgba(255,236,220,.12)'; c.beginPath(); c.ellipse(px, py, R * 1.9, R * 0.5, -0.18, Math.PI * 1.02, Math.PI * 1.98); c.stroke();
  }
  const gio = new IntersectionObserver((es) => { es.forEach((e) => { const G = gates.find((x) => x.el === e.target); G.vis = e.isIntersecting; }); kick(); }, { rootMargin: '60px 0px' });
  gates.forEach((G) => { gio.observe(G.el); new ResizeObserver(() => { sizeGate(G); if (G.vis) kick(); }).observe(G.cv); });

  /* ---------- main loop ---------- */
  function loop(ts) {
    raf = 0;
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
    last = ts;
    let again = false;
    if (heroVis) {
      if (dt) stepHero(dt);
      drawHero();
      if (!reduce() || probe || pops.length) again = true;
    } else if (probe && dt) { stepHero(dt); again = true; }
    for (const G of gates) if (G.vis) { drawGate(G, dt); if (!reduce()) again = true; }
    if (again) raf = requestAnimationFrame(loop);
  }
  new IntersectionObserver((es) => { heroVis = es[0].isIntersecting; syncHud(); kick(); }).observe(cv);
  new ResizeObserver(() => { buildHero(); kick(); }).observe(cv);
  reduceMQ.addEventListener('change', () => { onScroll(); kick(); });
  if (document.fonts) document.fonts.ready.then(kick);

  buildHero(); syncHud(); syncTheme(); onScroll();
})();
