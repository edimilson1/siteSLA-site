/* 09-parallax.js — paralaxe do DOM: camadas e objetos flutuantes */
'use strict';
/* ---------- paralaxe: camadas de fundo andam mais devagar que o texto ---------- */
(() => {
  if (reduce) return;
  const els = [...document.querySelectorAll('[data-px]')].map(el => ({ el, k: +el.dataset.px, mx: +(el.dataset.mx || 0), sec: el.closest('section, .sheet'), rot: +(el.dataset.rot || 0), top: el.dataset.anchor === 'top' }));
  let px = 0, py = 0, tx = 0, ty = 0, raf = 0;
  const apply = () => {
    raf = 0; px += (tx - px) * .12; py += (ty - py) * .12;
    const vc = innerHeight / 2;
    for (const o of els) {
      const r = o.sec.getBoundingClientRect();
      if (r.bottom < -400 || r.top > innerHeight + 400) continue;
      const off = ((o.top ? r.top : r.top + r.height / 2) - vc) * o.k;
      o.el.style.translate = `${(px * o.mx).toFixed(1)}px ${(off + py * o.mx * .6).toFixed(1)}px`;
      if (o.rot) o.el.style.rotate = `${(off * .04 * o.rot).toFixed(1)}deg`;
    }
    if (Math.abs(tx - px) > .002 || Math.abs(ty - py) > .002) raf = requestAnimationFrame(apply);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(apply); };
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick);
  addEventListener('pointermove', e => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; kick(); }, { passive: true });
  kick();
})();

