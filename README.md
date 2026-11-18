# siteSLA — site da Silvério Languages Academy

Site estático: abra o `index.html`. Sem build, sem instalar nada.

## Publicar no GitHub Pages (para o cliente ver)
1. Crie um repositório no GitHub e envie **o conteúdo desta pasta** (o `index.html` precisa ficar na raiz do repositório).
2. Repositório → **Settings → Pages → Build and deployment → Source: Deploy from a branch** → branch `main`, pasta `/ (root)` → Save.
3. Em ~1 minuto o site abre em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`. (Todos os caminhos são relativos, então funciona em subpasta.)

O arquivo `.nojekyll` já está aqui; não apague.

## Ver no computador
Duplo clique no `index.html` funciona, mas o navegador bloqueia as imagens dos fundos animados e do retrato quando o arquivo é local. Para ver tudo: extensão **Live Server** do VS Code, ou `python3 -m http.server` nesta pasta e abrir http://localhost:8000. No GitHub Pages isso não acontece.

## Estrutura (um arquivo por assunto)
```
index.html        ← a página inteira; cada bloco tem um banner  <!-- ═══ CURSOS ═══ -->
css/
  01-base.css  02-nav.css  03-hero.css  04-chapters.css  05-languages.css
  06-sections.css  07-sheet.css  08-dark-mode.css  09-parallax-fx.css
js/
  00-config.js          ← endereço do backend (única coisa a ajustar)
  01-core.js            ← dados do site (WhatsApp, e-mail, EAD), toast
  02-api.js             ← comunicação com o backend (desligada se apiBase vazio)
  03-chapters.js  04-reveal.js  05-content.js  06-form.js
  07-ascii-portrait.js  08-paper-edges.js  09-theme.js  10-parallax.js
  11-shaders.js  12-webgl-stage.js
img/                    ← fundos, fundador, logotipo, ícones
favicon.ico, apple-touch-icon.png, site.webmanifest, robots.txt, 404.html, .nojekyll
```

## Onde mexer
| Quero mudar… | Arquivo |
|---|---|
| Texto de qualquer seção | `index.html` (procure o banner da seção) |
| WhatsApp, e-mail, link do EAD (sem backend) | `js/01-core.js` (objeto `CONFIG` no topo) |
| Cores e fontes globais | `css/01-base.css` (variáveis no topo) |
| Menu · primeira tela | `css/02-nav.css` · `css/03-hero.css` |
| Cores de cada idioma | `css/05-languages.css` |
| Folha central, papel rasgado | `css/07-sheet.css` · `js/08-paper-edges.js` |
| Modo escuro | `css/08-dark-mode.css` · `js/09-theme.js` |
| Fundos das línguas | `img/1.jpg … 6.jpg` (0 globo · 1 e 6 flor · 2 Paris · 3 pagode · 4 Londres · 5 dançarina) |
| Brilho/transição dos fundos | `js/11-shaders.js` · `js/12-webgl-stage.js` |
| Objetos que flutuam | `js/10-parallax.js` · `css/09-parallax-fx.css` |

## Ligar o backend (depois)
Publique `../siteSLA-backend` na Cloudflare, copie o endereço dele e cole em `js/00-config.js`:
`window.SLA_API_BASE = 'https://sla-api.pages.dev';` — pronto: o formulário passa a gravar no banco (cifrado) e o cliente edita EAD/WhatsApp/comunicados/eventos no painel.
