/* 06-form.js — formulário de contato: valida no navegador e envia para POST /api/contact */
'use strict';
(() => {
  const form = document.getElementById('form'); if (!form) return;
  const msg = document.getElementById('msg');
  const btn = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    if (!f.nome.value.trim() || !/^\S+@\S+\.\S+$/.test(f.email.value)) { msg.textContent = 'Preencha seu nome e um e-mail válido.'; return; }
    if (!API.enabled) { // sem backend: abre o WhatsApp da secretaria com a mensagem pronta
      const t = `Olá! Sou ${f.nome.value.trim()} (${f.email.value.trim()}). Tenho interesse em: ${f.curso.value} · ${f.modal.value}.` + (f.msgtxt.value.trim() ? ` ${f.msgtxt.value.trim()}` : '');
      window.open('https://wa.me/' + CONFIG.whatsapp.sec + '?text=' + encodeURIComponent(t), '_blank', 'noopener');
      msg.textContent = 'Abrimos o WhatsApp com sua mensagem pronta. É só enviar.';
      return;
    }
    btn.disabled = true; msg.textContent = 'Enviando…';
    try {
      const r = await API.post('/contact', {
        name: f.nome.value.trim(), email: f.email.value.trim(), course: f.curso.value, modality: f.modal.value,
        message: f.msgtxt.value.trim(), website: f.website ? f.website.value : ''
      });
      msg.textContent = r.message || 'Mensagem enviada. Em breve a SLA responde.';
      f.reset();
    } catch (err) {
      msg.textContent = err.status === 429 ? 'Muitas tentativas. Aguarde alguns minutos.'
        : err.status ? (err.details?.[0]?.message || err.message)
        : 'Não foi possível enviar agora. Fale com a SLA pelo WhatsApp ou e-mail acima.';
    } finally { btn.disabled = false; }
  });
})();
