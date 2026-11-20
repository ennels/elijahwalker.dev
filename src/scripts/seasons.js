// The cover portrait's seasonal scene (seasons.css). The season follows the visitor's own date:
// Dec-Feb winter (Santa hat in December only, scarf all winter), Mar-May spring, Jun-Aug summer, Sep-Nov fall.
// For checking a season by hand: ?season=winter|spring|summer|fall, and &hat=1 for the hat.
// Particles come from a fixed seed, so the scene (and its still frame for reduced motion) is the same each load.
const sleeve = document.querySelector('.sleeve.has-cutout');
if (sleeve) {
  const q = new URLSearchParams(location.search);
  const m = new Date().getMonth();
  const SEASONS = ['winter', 'spring', 'summer', 'fall'];
  const season = SEASONS.includes(q.get('season')) ? q.get('season')
    : m === 11 || m <= 1 ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'fall';
  const hat = season === 'winter' && (q.has('season') ? q.get('hat') === '1' : m === 11);
  sleeve.dataset.season = season;
  if (hat) sleeve.dataset.hat = '';

  let seed = 7;
  const rnd = (a, b) => { seed = (seed * 16807) % 2147483647; return a + ((seed - 1) / 2147483646) * (b - a); };
  const back = sleeve.querySelector('.sky-back');
  const front = sleeve.querySelector('.sky-front');
  // One particle: an outer <i> that travels and an inner <i> that sways. vars: CSS custom properties.
  const add = (layer, kind, n, vars) => {
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.className = `p ${kind}`;
      const v = vars(i);
      p.style.cssText = Object.entries(v).map(([k, val]) => `--${k}:${val}`).join(';');
      p.append(document.createElement('i'));
      layer.append(p);
    }
  };
  const pick = (list) => list[Math.floor(rnd(0, list.length))];
  const time = (d) => ({ d: `${d.toFixed(2)}s`, d2: `${(d / rnd(2.5, 4)).toFixed(2)}s`, t: `${(-rnd(0, d)).toFixed(2)}s` });

  if (season === 'fall') {
    const leaf = (big) => () => ({ x: '-16cqi', y: `${rnd(-6, 80).toFixed(1)}cqi`, s: (big ? rnd(6.5, 9) : rnd(3.4, 5.4)).toFixed(2),
      r: `${rnd(0, 360).toFixed(0)}deg`, c: pick(['#8C3B12', '#A8501C', '#6B3A10', '#B5651E', '#7A2E10']), ...time(rnd(4, 8)) });
    add(back, 'gust', 4, () => ({ x: '-40cqi', y: `${rnd(10, 70).toFixed(1)}cqi`, s: rnd(18, 30).toFixed(1), ...time(rnd(2.2, 3.4)) }));
    add(back, 'leaf', 14, leaf(false));
    add(front, 'leaf', 4, leaf(true));
  } else if (season === 'winter') {
    const flake = (big) => () => ({ x: `${rnd(-4, 100).toFixed(1)}cqi`, y: '-6cqi', s: (big ? rnd(1.6, 2.6) : rnd(.6, 1.4)).toFixed(2),
      o: (big ? rnd(.85, 1) : rnd(.6, .95)).toFixed(2), ...time(big ? rnd(5, 8) : rnd(8, 14)) });
    add(back, 'flake', 34, flake(false));
    add(front, 'flake', 9, flake(true));
  } else if (season === 'spring') {
    add(back, 'drop', 34, () => ({ x: `${rnd(5, 125).toFixed(1)}cqi`, y: '-22cqi', s: rnd(6, 11).toFixed(1), ...time(rnd(.8, 1.3)) }));
    const petal = (big) => () => ({ x: `${rnd(-20, 80).toFixed(1)}cqi`, y: '-8cqi', s: (big ? rnd(3.4, 4.4) : rnd(2.2, 3.2)).toFixed(2),
      r: `${rnd(0, 360).toFixed(0)}deg`, c: pick(['#F4C6D2', '#EBA9BC', '#F8DCE3']), ...time(rnd(7, 11)) });
    add(back, 'petal', 9, petal(false));
    add(front, 'petal', 3, petal(true));
  } else {
    add(back, 'cloud', 3, (i) => ({ x: '100cqi', y: `${[6, 22, 34][i]}cqi`, s: [34, 24, 18][i], ...time([46, 34, 58][i]), t: `${-[8, 22, 40][i]}s` }));
    const fly = (big) => () => {
      const w = () => `${rnd(-14, 14).toFixed(1)}cqi`;
      return { x: `${rnd(4, 92).toFixed(1)}cqi`, y: `${rnd(8, 88).toFixed(1)}cqi`, s: (big ? rnd(1.8, 2.4) : rnd(1.1, 1.6)).toFixed(2),
        ax: w(), ay: w(), bx: w(), by: w(), cx: w(), cy: w(), ...time(rnd(6, 10)) };
    };
    add(back, 'fly', 12, fly(false));
    add(front, 'fly', 4, fly(true));
  }

  // Hold the scene still while the cover is off screen.
  new IntersectionObserver(([e]) => sleeve.classList.toggle('is-still', !e.isIntersecting)).observe(sleeve);
}
