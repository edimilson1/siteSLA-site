/* 09-theme.js — modo escuro com transição de tinta (View Transitions) */
'use strict';
/* ---------- modo escuro com transição de tinta ---------- */
(() => {
  const root = document.documentElement, btn = document.getElementById('themebtn'), cv = document.getElementById('ink');
  if (!btn || !cv) return;
  const isDark = () => root.dataset.theme === 'dark';
  const sync = () => { btn.setAttribute('aria-pressed', isDark()); btn.setAttribute('aria-label', isDark() ? 'Ativar modo claro' : 'Ativar modo escuro'); };
  const apply = (dark) => {
    if (dark) root.dataset.theme = 'dark'; else delete root.dataset.theme;
    try { localStorage.setItem('sla-theme', dark ? 'dark' : 'light'); } catch (e) {}
    if (window.__paintEdges) window.__paintEdges();
    sync();
  };
  sync();
  const gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
  const reduceM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let prog = null, U = {};
  if (gl) {
    const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const fs = `precision highp float;
    uniform vec2 res,org;uniform float t,seed,maxR;uniform vec3 c1,c2,cf;
    float h(vec2 p){p=fract(p*vec2(123.34,456.21)+seed);p+=dot(p,p+45.32);return fract(p.x*p.y);}
    float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<6;i++){s+=a*vn(p);p=p*2.03+vec2(17.1,9.7);a*=.5;}return s;}
    float ease(float x){x=clamp(x,0.,1.);return x*x*x*(x*(x*6.-15.)+10.);}
    void main(){
      vec2 p=vec2(gl_FragCoord.x,res.y-gl_FragCoord.y);
      vec2 d=p-org;float r=length(d)/maxR;float an=atan(d.y,d.x);
      vec2 uv=p/res.y;
      // campo fluido: distorce o espaço duas vezes para dar o aspecto de tinta
      vec2 q=vec2(fbm(uv*2.2+vec2(0.,t*.9)),fbm(uv*2.2+vec2(5.2,1.3)-t*.6));
      float w=fbm(uv*3.+q*2.4+t*.3);
      float streak=fbm(vec2(an*5.+q.x*3.,r*7.+q.y*2.));
      float e=(w-.5)*.62+(streak-.5)*.34;
      float L=mix(-.45,1.55,ease(t/.58));
      float T=mix(-.65,1.6,ease((t-.4)/.6));
      float lead=L-r+e, trail=T-r+e*1.12+.04;
      float aa=.0055;
      float a=smoothstep(-aa,aa,lead)*(1.-smoothstep(-aa,aa,trail));
      // marmoreio interno
      float m=fbm(uv*3.5+q*3.+vec2(0.,-t*.7));
      vec3 col=mix(c1,c2,smoothstep(.3,.75,m));
      float f=fbm(uv*2.+q*2.8+w*1.5);
      float lines=1.-smoothstep(0.,.085,abs(sin(f*22.)));
      float nearL=exp(-max(lead,0.)*5.5), nearT=exp(-max(-trail,0.)*5.5);
      col=mix(col,cf,lines*(nearL+nearT)*.55);
      float rim=(1.-smoothstep(0.,.05,abs(lead)))*.55+(1.-smoothstep(0.,.05,abs(trail)))*.4;
      col=mix(col,cf,rim);
      gl_FragColor=vec4(col*a,a);
    }`;
    const sh = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return o; };
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) prog = null; else {
      gl.useProgram(prog);
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      for (const n of ['res','org','t','seed','maxR','c1','c2','cf']) U[n] = gl.getUniformLocation(prog, n);
    }
  }
  let busy = false;
  const hex = h => [1,3,5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const setup = (toDark) => {
    const dpr = Math.min(1.5, devicePixelRatio || 1) * .75;
    cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); cv.style.display = 'block';
    gl.viewport(0, 0, cv.width, cv.height); gl.useProgram(prog);
    const bb = btn.getBoundingClientRect(), ox = (bb.left + bb.width / 2) * dpr, oy = (bb.top + bb.height / 2) * dpr;
    const maxR = Math.max(Math.hypot(ox, oy), Math.hypot(cv.width - ox, oy), Math.hypot(ox, cv.height - oy), Math.hypot(cv.width - ox, cv.height - oy));
    gl.uniform2f(U.res, cv.width, cv.height); gl.uniform2f(U.org, ox, oy); gl.uniform1f(U.maxR, maxR); gl.uniform1f(U.seed, Math.random() * 50);
    const pal = toDark ? ['#03050d', '#0d1f4f', '#8fb0ff'] : ['#f7f4ec', '#d7e1f6', '#1f56b8'];
    gl.uniform3fv(U.c1, hex(pal[0])); gl.uniform3fv(U.c2, hex(pal[1])); gl.uniform3fv(U.cf, hex(pal[2]));
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    return t => { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.uniform1f(U.t, t); gl.drawArrays(gl.TRIANGLES, 0, 3); };
  };
  const run = () => {
    const toDark = !isDark();
    if (!prog || reduceM) { apply(toDark); return; }
    busy = true;
    const draw = setup(toDark);
    const DUR = 2900, t0 = performance.now(); let swapped = false;
    const frame = now => {
      const t = Math.min(1, (now - t0) / DUR);
      if (!swapped && t >= .5) { swapped = true; apply(toDark); }
      draw(t);
      if (t < 1) requestAnimationFrame(frame); else { cv.style.display = 'none'; busy = false; }
    };
    requestAnimationFrame(frame);
  };
  window.__inkAt = (t, toDark) => prog && setup(toDark)(t);
  btn.addEventListener('click', () => { if (!busy) run(); });
})();

