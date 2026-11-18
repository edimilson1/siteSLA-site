'use strict';
/* 04-reveal.js — revelar ao rolar (estado final sempre visível sem JS) */
const rev = [...document.querySelectorAll('[data-r], .draw')];
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); }
}), { threshold: .15 }) : null;
if (io && !reduce) rev.forEach(el => {
  const r = el.getBoundingClientRect();
  if (r.top > innerHeight * .92) { el.classList.add('pre'); io.observe(el); }
});

