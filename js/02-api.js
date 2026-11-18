/* 02-api.js — cliente da API (fetch com tempo limite) e carregamento da configuração remota */
'use strict';
const API = {
  base: (window.SLA_API_BASE || '').replace(/\/+$/, '') + '/api',
  enabled: !!window.SLA_API_BASE,
  async request(path, opts = {}) {
    if (!API.enabled) throw new Error('API desligada (site estático)');
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 9000);
    try {
      const res = await fetch(API.base + path, {
        ...opts, signal: ctrl.signal,
        headers: { 'Accept': 'application/json', ...(opts.body ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}) },
        body: opts.body ? JSON.stringify(opts.body) : undefined
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { const e = new Error(data.error?.message || 'Falha na requisição'); e.status = res.status; e.details = data.error?.details; throw e; }
      return data;
    } finally { clearTimeout(to); }
  },
  get: p => API.request(p),
  post: (p, body, headers) => API.request(p, { method: 'POST', body, headers })
};

/* a página funciona sem API (site estático): em caso de erro ou API desligada mantém os valores padrão */
API.get('/config').then(c => {
  if (c.ead != null) CONFIG.ead = c.ead;
  if (c.courses) Object.assign(CONFIG.courses, c.courses);
  if (c.whatsapp) Object.assign(CONFIG.whatsapp, c.whatsapp);
  if (c.email) CONFIG.email = c.email;
  applyConfig();
}).catch(() => {});
