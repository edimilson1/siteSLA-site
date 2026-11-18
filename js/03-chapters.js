'use strict';
/* 03-chapters.js — palavras da marquee e navegação lateral de capítulos */
const words = [
  ['Hello','EN'],['Bonjour','FR'],['你好 nǐ hǎo','中文'],['Hola','ES'],
  ['Thank you','EN'],['Merci','FR'],['谢谢 xièxie','中文'],['Gracias','ES'],
  ['See you soon','EN'],['À bientôt','FR'],['再见 zàijiàn','中文'],['Hasta luego','ES'],
  ['Cheers','EN'],['Santé','FR'],['干杯 gānbēi','中文'],['Salud','ES']
];
const mk = () => words.map(([a,b]) => `<span lang="${b==='中文'?'zh':b.toLowerCase()}">${a}<small>${b}</small></span>`).join('');
document.getElementById('track').innerHTML = `<div>${mk()}</div><div>${mk()}</div>`;

  /* ---------- nav lateral de capítulos ---------- */
const sections = [...document.querySelectorAll('[data-ch]')];
const chapters = ['I','II','III','IV','V'];
const dots = document.getElementById('dots');
const chapterEls = sections.filter(s => s.classList.contains('chapter'));
chapterEls.forEach((el, i) => {
  const b = document.createElement('button');
  b.textContent = chapters[i]; b.setAttribute('aria-label', 'Capítulo ' + chapters[i]);
  b.onclick = () => el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  dots.appendChild(b);
});

