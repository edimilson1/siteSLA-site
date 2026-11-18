/* 11-webgl-stage.js — palco WebGL: texturas das cenas, dissolve por capítulo, partículas, laço de desenho */
'use strict';
(() => {
/* ---------- WebGL ---------- */
const canvas = document.getElementById('gl');
const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
const bar = document.getElementById('bar');
if (!gl) { document.documentElement.classList.add('no-gl'); return; }

const compile = (type, src) => {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
  return s;
};
const program = (vs, fs) => {
  const p = gl.createProgram(); gl.attachShader(p, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(p)); return p;
};

/* fundo: mármore em movimento + um motivo por capítulo */

/* partículas: letras italianas à deriva, repelidas pelo ponteiro */

const bg = program(bgVS, bgFS), pt = program(ptVS, ptFS);
const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);

const N = isSmall() ? 20 : 44;
const seeds = new Float32Array(N * 5);
for (let i = 0; i < N; i++) for (let k = 0; k < 4; k++) seeds[i*5+k] = Math.random(), seeds[i*5+4] = Math.floor(Math.random() * 64);
const pbuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pbuf); gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);

const tex = gl.createTexture();
const buildAtlas = () => {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0,0,512,512);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = 'italic 500 46px "Cormorant Garamond", "Noto Serif SC", Georgia, serif';
  const g = ('ABCDEFGHIJKLMNOPRSTUVWY' + 'abcdeghilmnorstu' + 'éèçàñ¿¡?!&' + '你好谢语学文中爱友家水山').split('');
  for (let i = 0; i < 64; i++) x.fillText(g[(i * 7) % g.length], (i % 8) * 64 + 32, Math.floor(i / 8) * 64 + 34);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
};
buildAtlas();
(document.fonts && document.fonts.load ? Promise.all([document.fonts.load('italic 500 46px "Cormorant Garamond"'), document.fonts.load('500 46px "Noto Serif SC"', '你好谢语学文中爱友家水山')]).then(buildAtlas).catch(()=>{}) : 0);

const tints = [[.80,.88,1],[.93,.75,.45],[1,.82,.35],[1,.78,.75],[1,.72,.40],[1,.82,.50],[.86,.78,.5]];
const U = (p, n) => gl.getUniformLocation(p, n);
const ub = { a:U(bg,'uA'), b:U(bg,'uB'), res:U(bg,'uRes'), m:U(bg,'uM'), t:U(bg,'uT'), ch:U(bg,'uCh'), vel:U(bg,'uVel') };
const up = { t:U(pt,'uT'), sc:U(pt,'uScroll'), px:U(pt,'uPx'), res:U(pt,'uRes'), m:U(pt,'uM'), tint:U(pt,'uTint'), atlas:U(pt,'uAtlas') };

/* estado: rolagem, ponteiro, capítulo contínuo */
let W = 0, H = 0, centers = [], docH = 1;
const st = { m:[.7,.6], tm:[.7,.6], ch:0, tch:0, vel:0, y:0, py:0 };
const measure = () => {
  centers = sections.map(s => { const r = s.getBoundingClientRect(); return scrollY + r.top + r.height / 2; });
  docH = Math.max(1, document.documentElement.scrollHeight - innerHeight);
};
const resize = () => {
  const s = Math.min(devicePixelRatio || 1, 1.5) * (isSmall() ? .55 : .7);
  W = canvas.width = Math.max(2, Math.round(innerWidth * s)); H = canvas.height = Math.max(2, Math.round(innerHeight * s));
  gl.viewport(0, 0, W, H); measure();
};
const chapterAt = y => {
  const mid = y + innerHeight * .5; let k = 0;
  // seções com data-ch repetido (parole, percorso, cta) ficam no capítulo final
  const idx = sections.map(s => +s.dataset.ch);
  for (let i = 0; i < centers.length - 1; i++) if (mid >= centers[i]) k = i;
  const a = centers[k], b = centers[Math.min(k + 1, centers.length - 1)];
  const f = b > a ? Math.min(1, Math.max(0, (mid - a) / (b - a))) : 0;
  return Math.min(6, idx[k] + (idx[Math.min(k+1, idx.length-1)] - idx[k]) * f);
};
const onScroll = () => {
  st.tch = chapterAt(scrollY);
  bar.style.transform = `scaleX(${Math.min(1, scrollY / docH)})`;
  const ci = Math.max(0, Math.min(6, Math.round(st.tch)));
  document.documentElement.style.setProperty('--gold', ['#dba52e','#dba52e','#ffc83d','#ecc9a2','#e9b84a','#ffa845','#dba52e'][ci]);
  dots.classList.toggle('lt', Math.abs(st.tch - 5) < .55 || (st.tch > .55 && st.tch < 1.5)); dots.style.opacity = st.tch > 5.6 ? 0 : 1; dots.style.pointerEvents = st.tch > 5.6 ? 'none' : '';
  const on = Math.round(st.tch) - 1;
  [...dots.children].forEach((b, i) => b.classList.toggle('on', i === on));
};
addEventListener('scroll', () => { onScroll(); if (reduce) draw(performance.now()); }, { passive: true });
addEventListener('resize', () => { resize(); onScroll(); if (reduce) draw(performance.now()); });
addEventListener('load', () => { measure(); onScroll(); });
addEventListener('pointermove', e => { st.tm = [e.clientX / innerWidth, 1 - e.clientY / innerHeight]; }, { passive: true });
if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); onScroll(); }).observe(document.body);

/* imagens dos capítulos como texturas */
const mkTex = () => {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([10, 12, 24, 255]));
  [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]
    .forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v));
  return t;
};
const imgTex = [0,1,2,3,4,5,6].map(i => {
  const t = mkTex(), im = new Image();
  im.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    if (reduce) draw(performance.now());
  };
  im.src = 'img/' + i + '.jpg';
  return t;
});

gl.disable(gl.DEPTH_TEST);
const t0 = performance.now();
function draw(now) {
  const T = reduce ? 6 : (now - t0) / 1000;
  st.m[0] += (st.tm[0] - st.m[0]) * .06; st.m[1] += (st.tm[1] - st.m[1]) * .06;
  st.ch += (st.tch - st.ch) * (reduce ? 1 : .07);
  const dy = scrollY - st.py; st.py = scrollY; st.vel += (Math.min(1, Math.abs(dy) / 60) - st.vel) * .1;

  gl.disable(gl.BLEND);
  gl.useProgram(bg);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  const ap = gl.getAttribLocation(bg, 'p'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(ub.res, W, H); gl.uniform2f(ub.m, st.m[0], st.m[1]); gl.uniform1f(ub.t, T);
  gl.uniform1f(ub.ch, st.ch); gl.uniform1f(ub.vel, st.vel);
  const ci = Math.min(5, Math.max(0, Math.floor(st.ch)));
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, imgTex[st.ch >= 6 ? 6 : ci]); gl.uniform1i(ub.a, 1);
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, imgTex[ci + 1]); gl.uniform1i(ub.b, 2);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.disableVertexAttribArray(ap);

  gl.useProgram(pt);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
  gl.bindBuffer(gl.ARRAY_BUFFER, pbuf);
  const as = gl.getAttribLocation(pt, 'aSeed'), ag = gl.getAttribLocation(pt, 'aG');
  gl.enableVertexAttribArray(as); gl.vertexAttribPointer(as, 4, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(ag); gl.vertexAttribPointer(ag, 1, gl.FLOAT, false, 20, 16);
  const i = Math.min(5, Math.floor(st.ch)), f = st.ch - i, a = tints[i], b = tints[Math.min(6, i + 1)];
  gl.uniform3f(up.tint, a[0] + (b[0]-a[0])*f, a[1] + (b[1]-a[1])*f, a[2] + (b[2]-a[2])*f);
  gl.uniform1f(up.t, T); gl.uniform1f(up.sc, scrollY / Math.max(1, innerHeight) * .35); gl.uniform1f(up.px, W / innerWidth);
  gl.uniform2f(up.res, W, H); gl.uniform2f(up.m, st.m[0] * 2 - 1, st.m[1] * 2 - 1);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(up.atlas, 0);
  gl.drawArrays(gl.POINTS, 0, N);
  gl.disableVertexAttribArray(as); gl.disableVertexAttribArray(ag);
}
resize(); onScroll(); st.ch = st.tch;
if (reduce) draw(performance.now());
else (function loop(now) { if (!document.hidden) draw(now); requestAnimationFrame(loop); })(performance.now());
})();
