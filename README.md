# Semantic Tab Grouper

Extensão de navegador (Manifest V3) que agrupa abas automaticamente pelo
**assunto** do conteúdo — não apenas pelo domínio — usando um modelo de
IA que roda **inteiramente no navegador**, sem backend e sem enviar
dados de navegação para lugar nenhum.

- **Site:** https://stg.caliberda.com.br
- **Chrome Web Store:** https://chromewebstore.google.com/detail/semantic-tab-grouper/illkdfiegklhcjogdhplihjekfjdocgk
- **Repositório:** https://github.com/cesarkali/Semantic-Tab-Grouper

## Como funciona

1. **Lê a página** — o content script usa [Readability.js](https://github.com/mozilla/readability) para extrair só o conteúdo principal de cada aba (sem menus, anúncios ou rodapés).
2. **Entende o assunto** — o texto é transformado num vetor de 384 dimensões por um modelo de linguagem ([`Xenova/all-MiniLM-L6-v2`](https://huggingface.co/Xenova/all-MiniLM-L6-v2)), rodando via WebAssembly dentro de um [offscreen document](https://developer.chrome.com/docs/extensions/reference/api/offscreen).
3. **Compara e sugere** — os vetores são comparados por similaridade de cosseno entre as abas da mesma janela. Acima do limiar configurado, nasce uma sugestão de grupo.
4. **Você decide** — por padrão a extensão só *sugere* (contador no ícone + lista no popup); você aceita, edita (adiciona/remove abas) ou ignora. Também dá pra deixar no modo automático, que agrupa sem perguntar.

## Modos de agrupamento

| Modo | Critério |
|---|---|
| `semantic` | Só pelo conteúdo — funciona mesmo em domínios diferentes |
| `domain` | Só pelo domínio (hostname) — não usa IA |
| `hybrid` | Mesmo domínio **ou** conteúdo parecido |

## Arquitetura

```
src/
  content/extractor.js     — content script: extrai texto da página (Readability + fallback)
  offscreen/                — offscreen document: roda o modelo de embeddings (WASM)
  background/service-worker.js — orquestra tudo: cache, detecção, sugestões, chrome.tabs.group()
  popup/                    — UI de sugestões (aceitar / editar / ignorar)
  options/                  — configurações (modo, limiar, domínios ignorados, etc.)
  utils/                    — storage (chrome.storage) e cálculo de similaridade
docs/                       — landing page (GitHub Pages)
store-assets/                — assets promocionais para a Chrome Web Store
```

O service worker do Manifest V3 não tem DOM e é encerrado com frequência,
então o modelo de IA roda isolado num offscreen document, que fecha
sozinho depois de 1 minuto sem uso.

## Privacidade

- O conteúdo das páginas é processado **localmente** — nunca é enviado a servidores.
- Não há telemetria nem analytics.
- Os pesos do modelo (~25 MB) são baixados uma única vez do Hugging Face e ficam em cache no navegador.
- Domínios sensíveis (bancos, e-mail etc.) podem ser excluídos manualmente nas configurações.

## Navegadores compatíveis

Qualquer navegador baseado em Chromium com suporte a `chrome.tabGroups` e
`chrome.offscreen` (Chromium 109+): **Chrome, Edge, Brave, Opera,
Vivaldi**. Firefox e Safari não são suportados — usam APIs de grupos de
abas diferentes.

## Rodando localmente

```bash
npm install
npm run dev     # build com watch (vite build --watch)
# ou
npm run build   # build de produção em dist/
```

Depois, em `chrome://extensions`:
1. Ative o "Modo do desenvolvedor".
2. Clique em "Carregar sem compactação" e selecione a pasta `dist/`.

## Stack

[Vite](https://vitejs.dev) + [`@crxjs/vite-plugin`](https://crxjs.dev) · [`@xenova/transformers`](https://github.com/xenova/transformers.js) · [`@mozilla/readability`](https://github.com/mozilla/readability)

## Licença

Ainda não definida.
