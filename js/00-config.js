/* 00-config.js — ÚNICO arquivo que você ajusta ao ligar o backend.
 *
 * apiBase: endereço do backend (projeto siteSLA-backend na Cloudflare), sem barra no final.
 *   ''  → site 100% estático (GitHub Pages): o formulário abre o WhatsApp com a mensagem pronta
 *         e os dados do site (EAD, WhatsApp, e-mail) vêm dos valores padrão em 01-core.js.
 *   'https://sla-api.pages.dev' → formulário grava no banco (cifrado), comunicados/eventos/EAD editáveis no painel.
 */
window.SLA_API_BASE = '';
