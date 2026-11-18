/* 07-ascii-portrait.js — retrato em ASCII art do diretor-geral (formas → foto, lente ao passar o mouse) */
'use strict';
/* ---------- retrato em ASCII art do diretor-geral ----------
   Ajuste COLS (detalhe) e INVERT (fundo claro) abaixo. */
(() => {
  const cv = document.getElementById('ascii'); if (!cv) return;
  const ctx = cv.getContext('2d');
  const SRC = 'img/ceo_cut.webp', COLS = 120, INVERT = false;
  const RAMP = ' .:-=+*#%@', GLITCH = '01<>/\\|[]{}+*#';
  let rows = 0, val, chr, buckets = [], base = null, baseOK = false, cw = 0, chh = 0, t0 = performance.now(), start = 0, visible = true;
  let mx = -1e4, my = -1e4;
  const STYLES = Array.from({ length: 10 }, (_, b) => { const a = .4 + .6 * b / 9; return `rgba(236,227,208,${a.toFixed(2)})`; });

  const placeholder = () => {           // busto genérico, até chegar a foto
    const c = document.createElement('canvas'); c.width = 400; c.height = 500; const x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, 400, 500);
    let g = x.createRadialGradient(150, 160, 10, 200, 200, 190); g.addColorStop(0, '#fff'); g.addColorStop(.6, '#a8a8a8'); g.addColorStop(1, '#383838');
    x.fillStyle = g; x.beginPath(); x.ellipse(200, 190, 92, 116, 0, 0, 7); x.fill();                 // rosto
    x.fillStyle = '#6a6a6a'; x.fillRect(165, 290, 70, 70);                                         // pescoço
    g = x.createLinearGradient(40, 340, 360, 500); g.addColorStop(0, '#9a9a9a'); g.addColorStop(1, '#262626');
    x.fillStyle = g; x.beginPath(); x.moveTo(20, 500); x.quadraticCurveTo(30, 360, 150, 340); x.lineTo(250, 340); x.quadraticCurveTo(370, 360, 380, 500); x.fill(); // paletó
    x.fillStyle = '#e8e8e8'; x.beginPath(); x.moveTo(160, 340); x.lineTo(200, 410); x.lineTo(240, 340); x.fill();                                         // camisa
    x.fillStyle = '#222'; x.beginPath(); x.moveTo(190, 372); x.lineTo(210, 372); x.lineTo(216, 470); x.lineTo(200, 486); x.lineTo(184, 470); x.fill();     // gravata
    x.fillStyle = '#1c1c1c'; x.beginPath(); x.ellipse(200, 110, 98, 62, 0, Math.PI, 0); x.fill();                                                         // cabelo
    x.fillStyle = '#2a2a2a'; [[168, 180], [232, 180]].forEach(([ex, ey]) => { x.beginPath(); x.ellipse(ex, ey, 14, 7, 0, 0, 7); x.fill(); });             // olhos
    x.fillStyle = '#555'; x.beginPath(); x.ellipse(200, 250, 26, 7, 0, 0, 7); x.fill();                                                                   // boca
    return c;
  };

  const blur = (src, w, h, r) => {                       // desfoque de caixa 2x (aprox. gaussiano)
    let a = src, o = new Float32Array(src.length);
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < h; y++) { let sum = 0, c = 0; const row = y * w; for (let x = -r; x <= r; x++) if (x >= 0 && x < w) { sum += a[row + x]; c++; }
        for (let x = 0; x < w; x++) { o[row + x] = sum / c; const add = x + r + 1, rem = x - r; if (add < w) { sum += a[row + add]; c++; } if (rem >= 0) { sum -= a[row + rem]; c--; } } }
      const t = new Float32Array(src.length);
      for (let x = 0; x < w; x++) { let sum = 0, c = 0; for (let y = -r; y <= r; y++) if (y >= 0 && y < h) { sum += o[y * w + x]; c++; }
        for (let y = 0; y < h; y++) { t[y * w + x] = sum / c; const add = y + r + 1, rem = y - r; if (add < h) { sum += o[add * w + x]; c++; } if (rem >= 0) { sum -= o[rem * w + x]; c--; } } }
      a = t; o = new Float32Array(src.length);
    }
    return a;
  };
  const sample = src => {
    const sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height, aspect = sh / sw;
    rows = Math.round(COLS * aspect * .5);
    const o = document.createElement('canvas'); o.width = COLS; o.height = rows; const x = o.getContext('2d', { willReadFrequently: true });
    x.drawImage(src, 0, 0, sw, sh, 0, 0, COLS, rows);
    const d = x.getImageData(0, 0, COLS, rows).data, n = COLS * rows, L = new Float32Array(n), M = new Float32Array(n);
    const cl = (v, a, b) => Math.min(1, Math.max(0, (v - a) / (b - a)));
    for (let i = 0; i < n; i++) {                              // máscara = transparência do recorte
      L[i] = (.2126 * d[i*4] + .7152 * d[i*4+1] + .0722 * d[i*4+2]) / 255;
      M[i] = cl(d[i*4+3] / 255, .35, .75);
    }
    const fg = []; for (let i = 0; i < n; i++) if (M[i] > .5) fg.push(L[i]); fg.sort((a, b) => a - b);
    const lo = fg[Math.floor(fg.length * .03)] || 0, hi = fg[Math.floor(fg.length * .98)] || 1, rg = Math.max(.01, hi - lo);
    const LM = new Float32Array(n); for (let i = 0; i < n; i++) LM[i] = L[i] * M[i];
    const bM = blur(M, COLS, rows, 4), bLM = blur(LM, COLS, rows, 4), mu = new Float32Array(n), D2 = new Float32Array(n);
    for (let i = 0; i < n; i++) { mu[i] = bLM[i] / Math.max(.05, bM[i]); D2[i] = (L[i] - mu[i]) ** 2 * M[i]; }
    const bD = blur(D2, COLS, rows, 4);
    val = new Float32Array(n); chr = new Array(n); buckets = Array.from({ length: 10 }, () => []);
    for (let i = 0; i < n; i++) {
      const sd = Math.sqrt(Math.max(1e-4, bD[i] / Math.max(.05, bM[i])));   // contraste local: realça olhos, boca e dobras
      const loc = .5 + .5 * Math.tanh(1.1 * (L[i] - mu[i]) / (sd + .04)), g = Math.pow(Math.min(1, Math.max(0, (L[i] - lo) / rg)), .8);
      let v = .35 * g + .65 * loc; v = .12 + .88 * Math.min(1, Math.max(0, v)); if (INVERT) v = 1 - v; v *= M[i];
      val[i] = v; chr[i] = RAMP[Math.min(RAMP.length - 1, Math.floor(v * RAMP.length))];
      if (v > .07) buckets[Math.min(9, Math.floor(v * 10))].push(i);
    }
    baseOK = false; layout(); start = performance.now(); draw(start);
  };

  const layout = () => {
    if (!rows) return;
    const dpr = Math.min(devicePixelRatio || 1, 2), w = cv.clientWidth;
    cv.width = Math.round(w * dpr); cw = cv.width / COLS; chh = cw * 2; cv.height = Math.round(chh * rows);
    baseOK = false;
    ctx.font = `${Math.round(chh * .92)}px "DM Mono", "Courier New", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  };

  const rnd = i => { const s = Math.sin(i * 12.9898) * 43758.5453; return s - Math.floor(s); };
  function drawAll(c, skipNear) {
    c.fillStyle = 'rgba(6,18,43,.9)';                                  // fundo escuro sob as letras, para ler sobre o círculo claro
    for (let b = 0; b < 10; b++) for (const i of buckets[b]) c.fillRect((i % COLS) * cw, Math.floor(i / COLS) * chh, cw + .5, chh + .5);
    for (let b = 0; b < 10; b++) { c.fillStyle = STYLES[b]; for (const i of buckets[b]) c.fillText(chr[i], (i % COLS + .5) * cw, (Math.floor(i / COLS) + .5) * chh); }
  }
  function draw(now) {
    if (!val) return;
    const p = reduce ? 3 : (now - start) / 2600;                       // revelação de cima para baixo
    const dpr = cv.width / cv.clientWidth, R = 95 * dpr;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (p < 1.45) {
      ctx.fillStyle = 'rgba(6,18,43,.9)';
      for (let b = 0; b < 10; b++) for (const i of buckets[b]) { const rowN = Math.floor(i / COLS) / rows; if (p * 1.25 - rowN - rnd(i) * .25 >= 0) ctx.fillRect((i % COLS) * cw, Math.floor(i / COLS) * chh, cw + .5, chh + .5); }
      for (let b = 0; b < 10; b++) {
        ctx.fillStyle = STYLES[b];
        for (const i of buckets[b]) {
          const rowN = Math.floor(i / COLS) / rows, rev = p * 1.25 - rowN - rnd(i) * .25;
          if (rev < 0) continue;
          ctx.fillText(rev < .12 ? GLITCH[Math.floor(rnd(i + now * .01) * GLITCH.length)] : chr[i], (i % COLS + .5) * cw, (Math.floor(i / COLS) + .5) * chh);
        }
      }
      return;
    }
    const t = reduce ? 99 : (now - start) / 1000;                     // 0-3.8 s forma · até 4.6 s segura · até 5.8 s some
    const fade = t < 4.6 ? 1 : Math.max(0, 1 - (t - 4.6) / 1.2);
    if (t > 4.6 && !img.classList.contains('on')) img.classList.add('on');
    if (fade > 0) {
      if (!baseOK || !base || base.width !== cv.width || base.height !== cv.height) {
        base = document.createElement('canvas'); base.width = cv.width; base.height = cv.height;
        const bx = base.getContext('2d'); bx.font = ctx.font; bx.textAlign = 'center'; bx.textBaseline = 'middle'; drawAll(bx); baseOK = true;
      }
      ctx.globalAlpha = fade; ctx.drawImage(base, 0, 0); ctx.globalAlpha = 1;
    }
    if (mx > -1e3 && t > 1) {                                           // lupa: mostra o ASCII sobre a foto perto do cursor
      const g = ctx.createRadialGradient(mx, my, R * .6, mx, my, R);
      g.addColorStop(0, 'rgba(6,18,43,.86)'); g.addColorStop(1, 'rgba(6,18,43,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, R, 0, 7); ctx.fill();
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--gold') || '#dba52e';
      const c0 = Math.floor((mx - R) / cw), c1 = Math.ceil((mx + R) / cw), r0 = Math.floor((my - R) / chh), r1 = Math.ceil((my + R) / chh);
      for (let r = Math.max(0, r0); r < Math.min(rows, r1); r++) for (let c = Math.max(0, c0); c < Math.min(COLS, c1); c++) {
        const i = r * COLS + c; if (val[i] <= .07) continue;
        const cx = (c + .5) * cw, cy = (r + .5) * chh; if ((cx - mx) ** 2 + (cy - my) ** 2 > R * R * .8) continue;
        ctx.fillText(chr[i], cx, cy);
      }
    }
  }

  const img = document.querySelector('.cut');
  if (reduce) img.classList.add('on');
  const im = new Image();
  im.onload = () => sample(im); im.onerror = () => img.classList.add('on'); im.src = SRC;
  cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(), k = cv.width / r.width; mx = (e.clientX - r.left) * k; my = (e.clientY - r.top) * k; });
  cv.addEventListener('pointerleave', () => { mx = my = -1e4; });
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(cv);
  addEventListener('resize', () => { layout(); draw(performance.now()); });
  if (document.fonts && document.fonts.load) document.fonts.load('20px "DM Mono"').then(() => { layout(); draw(performance.now()); }).catch(() => {});
  if (!reduce) (function loop(now) { if (visible && !document.hidden) draw(now); setTimeout(() => requestAnimationFrame(loop), 33); })(performance.now());
})();


