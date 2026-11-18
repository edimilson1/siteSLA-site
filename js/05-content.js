/* 05-content.js — comunicados e eventos vindos da API (substituem os espaços reservados) */
'use strict';
(() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = iso => { try { return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }); } catch { return ''; } };

  API.get('/notices').then(({ items }) => {
    const ul = document.getElementById('notices-list'); if (!ul || !items?.length) return;
    ul.innerHTML = items.map(n => `<li>${n.pinned ? '<b>Fixado</b> ' : ''}<strong>${esc(n.title)}</strong><br>${esc(n.body)}</li>`).join('');
  }).catch(() => {});

  API.get('/events').then(({ items }) => {
    const box = document.getElementById('event-feature'); if (!box || !items?.length) return;
    const e = items[0];
    box.querySelector('.ph')?.remove();
    const p = document.createElement('p');
    p.innerHTML = `<strong>${esc(e.title)}</strong>${e.starts_at ? ' · ' + esc(fmt(e.starts_at)) : ''}${e.location ? ' · ' + esc(e.location) : ''}<br>${esc(e.description || '')}`;
    box.appendChild(p);
  }).catch(() => {});
})();
