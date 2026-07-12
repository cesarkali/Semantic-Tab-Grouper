export const DEFAULT_SETTINGS = {
  enabled: true,
  // 'semantic' -> agrupa só por similaridade de conteúdo
  // 'domain'   -> agrupa só por mesmo domínio (não usa ML)
  // 'hybrid'   -> agrupa se for o mesmo domínio OU se o conteúdo for similar
  mode: 'semantic',
  threshold: 0.65,
  // domínios que nunca são processados nem agrupados (privacidade: bancos, e-mail, etc)
  ignoredDomains: [],
  minGroupSize: 2,
  // true  -> o detector só sugere (badge + lista no popup), você aceita ou ignora
  // false -> agrupa direto, sem pedir confirmação
  suggestOnly: true,
  // intervalo (em minutos) da verificação periódica automática de todas as
  // abas abertas — roda também uma vez, imediatamente, na instalação
  autoCheckMinutes: 5
};

const SETTINGS_KEY = 'settings';
const EMBEDDING_PREFIX = 'emb:';

// Configurações ficam em `sync` (pequenas, seguem o usuário entre máquinas).
export async function getSettings() {
  const stored = await chrome.storage.sync.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(stored[SETTINGS_KEY] || {}) };
}

export async function saveSettings(partial) {
  const current = await getSettings();
  const next = { ...current, ...partial };
  await chrome.storage.sync.set({ [SETTINGS_KEY]: next });
  return next;
}

// Embeddings ficam em `local` (podem ser muitos e os vetores são maiores).
function embeddingKey(url) {
  return `${EMBEDDING_PREFIX}${url}`;
}

export async function getCachedEmbedding(url) {
  const key = embeddingKey(url);
  const stored = await chrome.storage.local.get(key);
  return stored[key] || null;
}

export async function setCachedEmbedding(url, vector, title) {
  const key = embeddingKey(url);
  await chrome.storage.local.set({
    [key]: { vector, title, cachedAt: Date.now() }
  });
}

export async function clearEmbeddingCache() {
  const all = await chrome.storage.local.get(null);
  const embeddingKeys = Object.keys(all).filter((k) => k.startsWith(EMBEDDING_PREFIX));
  if (embeddingKeys.length) {
    await chrome.storage.local.remove(embeddingKeys);
  }
}
