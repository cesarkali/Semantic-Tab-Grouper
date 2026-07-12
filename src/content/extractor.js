import { Readability } from '@mozilla/readability';

const MAX_CONTENT_LENGTH = 3000;

/**
 * Extrai o texto principal da página usando Readability sobre um clone do
 * documento (Readability muta o DOM que recebe, então nunca rodar no document real).
 */
function extractWithReadability() {
  const clone = document.cloneNode(true);
  const article = new Readability(clone).parse();
  if (article?.textContent) {
    return { title: article.title, content: article.textContent };
  }
  return null;
}

/**
 * Fallback leve para páginas onde o Readability falha (ex: SPAs sem
 * estrutura de artigo, telas de login, etc). Foca em <main>/<article>/<h1>/<p>
 * para evitar capturar menus, rodapés e navegação.
 */
function extractFallback() {
  const root = document.querySelector('main, article') || document.body;
  const headings = Array.from(root.querySelectorAll('h1')).map((el) => el.innerText.trim());
  const paragraphs = Array.from(root.querySelectorAll('p'))
    .map((el) => el.innerText.trim())
    .filter((text) => text.length > 20);

  return {
    title: document.title,
    content: [...headings, ...paragraphs].join('\n')
  };
}

function extractPageContent() {
  let result = null;

  try {
    result = extractWithReadability();
  } catch (err) {
    console.warn('[Semantic Tab Grouper] Readability falhou, usando fallback:', err);
  }

  if (!result || result.content.trim().length < 50) {
    result = extractFallback();
  }

  return {
    title: result.title || document.title,
    content: result.content.trim().slice(0, MAX_CONTENT_LENGTH)
  };
}

function sendToServiceWorker() {
  const { title, content } = extractPageContent();

  if (!content) return;

  // tabId não é acessível a partir do content script (API restrita ao
  // background); o service worker o recupera via `sender.tab.id` no listener.
  chrome.runtime.sendMessage({
    type: 'PAGE_CONTENT_EXTRACTED',
    payload: {
      url: location.href,
      title,
      content
    }
  });
}

sendToServiceWorker();
