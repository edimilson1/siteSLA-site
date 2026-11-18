/* 01-core.js — estado global, utilitários e ligação de links (WhatsApp, EAD, e-mail) */
'use strict';
document.documentElement.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = () => innerWidth < 760;

/* Valores padrão. Em produção são substituídos por GET /api/config (ver 02-api.js),
   editáveis no painel /admin sem mexer no código. */
const CONFIG = {
  ead: '',
  courses: { ingles: '', frances: '', espanhol: '', mandarim: '', ia: '' },
  whatsapp: { sec: '5571982606512', part: '5571982841804' },
  email: 'silveriolanguagesacademy@gmail.com'
};

const toast = msg => {
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3800);
};

/* aplica CONFIG aos elementos da página; pode ser chamada de novo após carregar a configuração remota */
function applyConfig() {
  document.querySelectorAll('[data-wa]').forEach(a => { a.href = 'https://wa.me/' + CONFIG.whatsapp[a.dataset.wa]; });
  document.querySelectorAll('[data-ead]').forEach(a => {
    const url = (a.dataset.course && CONFIG.courses[a.dataset.course]) || CONFIG.ead;
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
    else { a.removeAttribute('target'); }
    if (!a.dataset.bound) {
      a.dataset.bound = '1';
      a.addEventListener('click', e => {
        const u = (a.dataset.course && CONFIG.courses[a.dataset.course]) || CONFIG.ead;
        if (!u) { e.preventDefault(); toast('O link oficial da plataforma EAD ainda será inserido.'); }
      });
    }
  });
  document.querySelectorAll('a[href^="mailto:"], #mail').forEach(a => { if (a.id === 'mail') { a.href = 'mailto:' + CONFIG.email; a.textContent = CONFIG.email; } });
}
applyConfig();

const copyBtn = document.getElementById('copymail');
if (copyBtn) copyBtn.addEventListener('click', () => {
  const done = () => toast('E-mail copiado: ' + CONFIG.email);
  (navigator.clipboard ? navigator.clipboard.writeText(CONFIG.email).then(done) : Promise.reject()).catch(() => {
    const r = document.createRange(); r.selectNodeContents(document.getElementById('mail'));
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('Selecionado: copie com Ctrl+C');
  });
});


/* Aviso só quando o site é aberto com duplo clique (file://): o navegador bloqueia imagens no WebGL/canvas.
   Não aparece no GitHub Pages nem em nenhum site publicado. Pode ser fechado. */
if (location.protocol === 'file:') {
  addEventListener('DOMContentLoaded', () => {
    const b = document.createElement('div');
    b.setAttribute('role', 'note');
    b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#e9a825;color:#111;padding:10px 44px 10px 16px;font:14px/1.4 system-ui;text-align:center';
    b.textContent = 'Você abriu o arquivo direto do computador, então o navegador bloqueia os fundos animados e o retrato. Publicado (GitHub Pages) ou com Live Server, aparece tudo.';
    const x = document.createElement('button');
    x.textContent = '×'; x.setAttribute('aria-label', 'Fechar aviso');
    x.style.cssText = 'position:absolute;right:10px;top:6px;border:0;background:none;font-size:22px;line-height:1;cursor:pointer';
    x.onclick = () => b.remove();
    b.append(x); document.body.append(b);
  });
}
