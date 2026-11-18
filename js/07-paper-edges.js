/* 07-paper-edges.js — bordas de papel rasgado geradas no navegador (diferentes a cada visita) */
'use strict';
/* ---------- papel rasgado: bordas caóticas, sempre diferentes ---------- */
try { if (localStorage.getItem('sla-theme') === 'dark') document.documentElement.dataset.theme = 'dark'; } catch (e) {}
(() => {
  const R = Math.random;
  const profile = (w, H) => {
    const n = Math.ceil(w / 2) + 2, y = new Float32Array(n);
    const waves = Array.from({ length: 7 }, () => ({ f: 2 * Math.PI / (70 + R() * 900), p: R() * 6.28, a: 3 + R() * 11 }));
    const tears = Array.from({ length: 4 + Math.floor(R() * 6) }, () => ({ x: R() * w, wd: 14 + R() * 140, a: (R() - .5) * 46 }));
    let noise = new Float32Array(n).map(() => (R() - .5) * 9);
    for (let k = 0; k < 2; k++) noise = noise.map((v, i) => (v + (noise[i - 1] ?? v) + (noise[i + 1] ?? v)) / 3 * 1.5);
    for (let i = 0; i < n; i++) {
      const x = i * 2; let v = H * .5;
      for (const q of waves) v += Math.sin(x * q.f + q.p) * q.a;
      for (const t of tears) { const u = Math.max(0, Math.min(1, (x - t.x) / t.wd + .5)); v += t.a * (u * u * (3 - 2 * u)) * (R() > .995 ? 1.15 : 1); }
      y[i] = Math.max(H * .18, Math.min(H * .84, v + noise[i] + (R() - .5) * 2.4));
    }
    return y;
  };
  const PAL = {
    light: { sh: 'rgba(0,0,0,.45)', rim: 'rgba(255,255,255,.96)', mid: '#eef2fa', body: '#f8faff', fib: 'rgba(255,255,255,.8)' },
    dark:  { sh: 'rgba(110,150,255,.45)', rim: 'rgba(120,150,230,.9)', mid: '#16244a', body: '#0a1430', fib: 'rgba(140,170,240,.7)' }
  };
  const make = (w, H, flip, y0, pal) => {
    const c = document.createElement('canvas'); c.width = w; c.height = H; const g = c.getContext('2d');
    const sg = flip ? 1 : -1, base = flip ? 0 : H, yy = i => flip ? H - y0[i] : y0[i];
    const k0 = y0.rimK;
    const edge = k => { g.beginPath(); g.moveTo(0, base); for (let i = 0; i < y0.length; i++) g.lineTo(i * 2, yy(i) + sg * k); g.lineTo(w + 4, base); g.closePath(); };
    g.shadowColor = pal.sh; g.shadowBlur = 16; g.shadowOffsetY = flip ? 5 : -5;
    g.fillStyle = pal.rim; edge(4 + k0 * 3); g.fill();
    g.shadowColor = 'transparent';
    g.fillStyle = pal.mid; edge(1); g.fill();
    g.fillStyle = pal.body; edge(-3 - k0 * 3); g.fill();
    g.strokeStyle = pal.fib; g.lineWidth = 1;
    for (let i = 0; i < y0.length; i++) if (y0.fib[i]) {
      const x = i * 2;
      g.beginPath(); g.moveTo(x, yy(i) + sg * 3); g.lineTo(x + y0.fx[i], yy(i) + sg * (3 + y0.fl[i])); g.stroke();
    }
    return c.toDataURL('image/png');
  };
  const withFibers = (y) => { y.rimK = R(); y.fib = Array.from(y, () => R() > .5); y.fx = Array.from(y, () => (R() - .5) * 5); y.fl = Array.from(y, () => 2 + R() * 7); return y; };
  let lastW = 0, P = null;
  const paint = () => {
    if (!P) return;
    const th = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light', pal = PAL[th], r = document.documentElement.style;
    r.setProperty('--edgeT', `url(${make(P.w, P.H, false, P.T, pal)})`);
    r.setProperty('--edgeB', `url(${make(P.w, P.H, true, P.B, pal)})`);
    r.setProperty('--edgeF', `url(${make(P.w, P.H, false, P.F, pal)})`);
    r.setProperty('--edgeH', `url(${make(P.w, P.hh, true, P.Hd, pal)})`);
  };
  const build = () => {
    const w = Math.min(2200, Math.round(innerWidth)), H = innerWidth < 700 ? 90 : 140, hh = innerWidth < 700 ? 34 : 50;
    if (Math.abs(w - lastW) < 120) return; lastW = w;
    P = { w, H, hh, T: withFibers(profile(w, H)), B: withFibers(profile(w, H)), F: withFibers(profile(w, H)), Hd: withFibers(profile(w, hh)) };
    const r = document.documentElement.style; r.setProperty('--eh', H + 'px'); r.setProperty('--hh', hh + 'px');
    paint();
  };
  window.__paintEdges = paint;
  build(); let to; addEventListener('resize', () => { clearTimeout(to); to = setTimeout(build, 250); });
})();


