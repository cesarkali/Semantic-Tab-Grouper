import { cosineSimilarity } from '../utils/similarity.js';
import { getSettings, getCachedEmbedding, setCachedEmbedding, clearEmbeddingCache } from '../utils/storage.js';

const OFFSCREEN_URL = chrome.runtime.getURL('src/offscreen/offscreen.html');
const OFFSCREEN_IDLE_ALARM = 'close-offscreen-idle';
const OFFSCREEN_IDLE_MINUTES = 1;

const GROUP_COLORS = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];

// Estado em memória: uma aba fechada/o service worker reiniciando limpa tudo,
// o que é aceitável pois o cache persistente (chrome.storage.local) permite
// reconstruir os vetores rapidamente sem reprocessar o conteúdo da página.
const tabInfoById = new Map(); // tabId -> { url, title, vector, domain }

// Sugestões pendentes do detector (modo suggestOnly): o usuário decide se
// aceita ou ignora, em vez de a extensão agrupar sozinha.
const pendingSuggestions = new Map(); // id -> { id, allIds, newTabId, existingGroupId, label, color }

function updateBadge() {
  const count = pendingSuggestions.size;
  chrome.action.setBadgeText({ text: count ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#8b7bf5' });
}

// ---------------------------------------------------------------------------
// Ciclo de vida do Offscreen Document
// ---------------------------------------------------------------------------

async function hasOffscreenDocument() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [OFFSCREEN_URL]
  });
  return contexts.length > 0;
}

async function ensureOffscreenDocument() {
  if (!(await hasOffscreenDocument())) {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_URL,
      reasons: ['WORKERS'],
      justification: 'Executar inferência de ML (Transformers.js/WASM) para gerar embeddings de texto sem travar a UI.'
    });
  }
  scheduleOffscreenShutdown();
}

function scheduleOffscreenShutdown() {
  chrome.alarms.create(OFFSCREEN_IDLE_ALARM, { delayInMinutes: OFFSCREEN_IDLE_MINUTES });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === OFFSCREEN_IDLE_ALARM && (await hasOffscreenDocument())) {
    await chrome.offscreen.closeDocument();
  }
});

async function generateEmbedding(text) {
  await ensureOffscreenDocument();
  const response = await chrome.runtime.sendMessage({
    target: 'offscreen',
    type: 'GENERATE_EMBEDDING',
    payload: { text }
  });
  scheduleOffscreenShutdown(); // adia o fechamento, já que acabamos de usar o pipeline
  if (!response?.ok) {
    throw new Error(response?.error || 'Falha ao gerar embedding');
  }
  return response.vector;
}

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function isIgnoredDomain(domain, ignoredDomains) {
  if (!domain) return true;
  return ignoredDomains.some((ignored) => domain === ignored || domain.endsWith(`.${ignored}`));
}

function colorForLabel(label) {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) | 0;
  }
  return GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length];
}

function labelForGroup(members) {
  const domains = new Set(members.map((m) => m.domain));
  if (domains.size === 1) {
    return [...domains][0];
  }
  const shortestTitle = members
    .map((m) => m.title || '')
    .filter(Boolean)
    .sort((a, b) => a.length - b.length)[0];
  if (!shortestTitle) return 'Grupo';
  return shortestTitle.length > 24 ? `${shortestTitle.slice(0, 24)}…` : shortestTitle;
}

// ---------------------------------------------------------------------------
// Agrupamento
// ---------------------------------------------------------------------------

async function findMatchingTabIds(newTabId, newInfo, settings) {
  const newTab = await chrome.tabs.get(newTabId);
  const matches = [];

  for (const [tabId, info] of tabInfoById) {
    if (tabId === newTabId) continue;

    let existingTab;
    try {
      existingTab = await chrome.tabs.get(tabId);
    } catch {
      tabInfoById.delete(tabId); // aba já não existe mais
      continue;
    }
    if (existingTab.windowId !== newTab.windowId) continue;

    const sameDomain = info.domain && info.domain === newInfo.domain;
    const similarity = info.vector && newInfo.vector ? cosineSimilarity(info.vector, newInfo.vector) : 0;

    const isMatch =
      settings.mode === 'domain'
        ? sameDomain
        : settings.mode === 'hybrid'
          ? sameDomain || similarity >= settings.threshold
          : similarity >= settings.threshold; // 'semantic'

    if (isMatch) matches.push(tabId);
  }

  return matches;
}

// Recalcula rótulo, cor e grupo existente para um conjunto arbitrário de
// tabIds — usado tanto na detecção automática quanto depois que o usuário
// edita a sugestão (adiciona/remove abas) no popup.
async function computePlanForTabIds(tabIds, windowId) {
  let existingGroupId = chrome.tabGroups.TAB_GROUP_ID_NONE;
  const members = [];

  for (const id of tabIds) {
    const tab = await chrome.tabs.get(id);
    if (existingGroupId === chrome.tabGroups.TAB_GROUP_ID_NONE && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      existingGroupId = tab.groupId;
    }
    const cached = tabInfoById.get(id);
    members.push({ title: cached?.title || tab.title, domain: cached?.domain || getDomain(tab.url) });
  }

  const label = labelForGroup(members);

  return {
    allIds: tabIds,
    windowId,
    existingGroupId,
    label,
    color: colorForLabel(label),
    tabTitles: members.map((m) => m.title).filter(Boolean)
  };
}

// Monta o plano de agrupamento (quem entraria no grupo, com que título e cor)
// sem tocar em nenhuma API do Chrome ainda — permite decidir depois se aplica
// direto ou guarda como sugestão para o usuário confirmar (e possivelmente
// editar, adicionando/removendo abas, antes de aceitar).
async function buildGroupPlan(newTabId, newInfo, settings) {
  const matchingIds = await findMatchingTabIds(newTabId, newInfo, settings);
  if (matchingIds.length === 0) return null;

  const allIds = [...matchingIds, newTabId];
  if (allIds.length < settings.minGroupSize) return null;

  const newTab = await chrome.tabs.get(newTabId);

  // Se a aba nova já está no mesmo grupo visual que todas as suas
  // correspondentes, não há nada de novo a sugerir/aplicar.
  if (newTab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
    let allAlreadyGrouped = true;
    for (const id of matchingIds) {
      const tab = await chrome.tabs.get(id);
      if (tab.groupId !== newTab.groupId) {
        allAlreadyGrouped = false;
        break;
      }
    }
    if (allAlreadyGrouped) return null;
  }

  return computePlanForTabIds(allIds, newTab.windowId);
}

async function applyGroupPlan(plan) {
  // Abas podem ter fechado entre a sugestão e a aceitação.
  const validIds = [];
  for (const id of plan.allIds) {
    try {
      await chrome.tabs.get(id);
      validIds.push(id);
    } catch {
      /* aba já fechou, ignora */
    }
  }
  if (validIds.length < 2) return;

  const groupId = await chrome.tabs.group(
    plan.existingGroupId !== chrome.tabGroups.TAB_GROUP_ID_NONE
      ? { tabIds: validIds, groupId: plan.existingGroupId }
      : { tabIds: validIds }
  );

  if (plan.existingGroupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
    await chrome.tabGroups.update(groupId, { title: plan.label, color: plan.color });
  }
}

function queueSuggestion(plan) {
  // Evita sugestões duplicadas para a mesma aba que disparou a detecção
  // (a última do array, por convenção de buildGroupPlan) — ex: duas abas do
  // grupo terminam de carregar quase ao mesmo tempo.
  const triggerTabId = plan.allIds[plan.allIds.length - 1];
  for (const existing of pendingSuggestions.values()) {
    if (existing.allIds.includes(triggerTabId)) return;
  }
  const id = `sugg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  pendingSuggestions.set(id, { ...plan, id });
  updateBadge();
}

async function decideGrouping(newTabId, newInfo, settings) {
  const plan = await buildGroupPlan(newTabId, newInfo, settings);
  if (!plan) return;

  if (settings.suggestOnly) {
    queueSuggestion(plan);
  } else {
    await applyGroupPlan(plan);
  }
}

// ---------------------------------------------------------------------------
// Pipeline principal: conteúdo extraído -> embedding -> agrupamento
// ---------------------------------------------------------------------------

async function handlePageContent(tabId, { url, title, content }) {
  const settings = await getSettings();
  if (!settings.enabled) return;

  const domain = getDomain(url);
  if (isIgnoredDomain(domain, settings.ignoredDomains)) return;

  let vector = null;

  if (settings.mode !== 'domain') {
    const cached = await getCachedEmbedding(url);
    if (cached) {
      vector = cached.vector;
    } else {
      vector = await generateEmbedding(`${title}\n${content}`);
      await setCachedEmbedding(url, vector, title);
    }
  }

  const info = { url, title, domain, vector };
  tabInfoById.set(tabId, info);

  await decideGrouping(tabId, info, settings);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'PAGE_CONTENT_EXTRACTED' && sender.tab?.id != null) {
    handlePageContent(sender.tab.id, message.payload).catch((err) =>
      console.error('[Semantic Tab Grouper] Falha ao processar aba:', err)
    );
    return false;
  }

  if (message?.type === 'CLEAR_CACHE') {
    clearEmbeddingCache()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (message?.type === 'REGROUP_NOW') {
    regroupAllOpenTabs()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (message?.type === 'GET_SUGGESTIONS') {
    const suggestions = [...pendingSuggestions.values()].map((plan) => ({
      id: plan.id,
      label: plan.label,
      color: plan.color,
      tabCount: plan.allIds.length,
      tabTitles: plan.tabTitles
    }));
    sendResponse({ ok: true, suggestions });
    return false;
  }

  if (message?.type === 'APPLY_SUGGESTION') {
    const plan = pendingSuggestions.get(message.payload.id);
    if (!plan) {
      sendResponse({ ok: false, error: 'Sugestão não encontrada (talvez uma aba tenha fechado).' });
      return false;
    }
    applyGroupPlan(plan)
      .then(() => {
        pendingSuggestions.delete(message.payload.id);
        updateBadge();
        sendResponse({ ok: true });
      })
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (message?.type === 'DISMISS_SUGGESTION') {
    pendingSuggestions.delete(message.payload.id);
    updateBadge();
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === 'GET_SUGGESTION_EDIT_OPTIONS') {
    const plan = pendingSuggestions.get(message.payload.id);
    if (!plan) {
      sendResponse({ ok: false, error: 'Sugestão não encontrada.' });
      return false;
    }
    chrome.tabs
      .query({ windowId: plan.windowId })
      .then((tabs) => {
        const included = [];
        const available = [];
        for (const tab of tabs) {
          if (!tab.url || !/^https?:/.test(tab.url)) continue;
          const entry = { tabId: tab.id, title: tab.title || tab.url };
          (plan.allIds.includes(tab.id) ? included : available).push(entry);
        }
        sendResponse({ ok: true, included, available });
      })
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (message?.type === 'UPDATE_SUGGESTION') {
    const plan = pendingSuggestions.get(message.payload.id);
    const tabIds = message.payload.tabIds;
    if (!plan) {
      sendResponse({ ok: false, error: 'Sugestão não encontrada.' });
      return false;
    }
    if (!Array.isArray(tabIds) || tabIds.length < 2) {
      sendResponse({ ok: false, error: 'Selecione ao menos 2 abas.' });
      return false;
    }
    computePlanForTabIds(tabIds, plan.windowId)
      .then((updatedPlan) => {
        const merged = { ...updatedPlan, id: plan.id };
        pendingSuggestions.set(plan.id, merged);
        sendResponse({
          ok: true,
          suggestion: {
            id: merged.id,
            label: merged.label,
            color: merged.color,
            tabCount: merged.allIds.length,
            tabTitles: merged.tabTitles
          }
        });
      })
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  return false;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabInfoById.delete(tabId);

  for (const [id, plan] of pendingSuggestions) {
    if (plan.allIds.includes(tabId)) pendingSuggestions.delete(id);
  }
  updateBadge();
});

// ---------------------------------------------------------------------------
// Re-agrupamento manual (botão "Agrupar agora" no popup)
// ---------------------------------------------------------------------------

// Reextrai o texto de abas ainda não processadas via uma função autocontida
// (não pode importar o Readability aqui: chrome.scripting.executeScript com
// `func` roda isolado, sem acesso a módulos do bundle).
function inlineFallbackExtraction() {
  const root = document.querySelector('main, article') || document.body;
  const headings = Array.from(root.querySelectorAll('h1')).map((el) => el.innerText.trim());
  const paragraphs = Array.from(root.querySelectorAll('p'))
    .map((el) => el.innerText.trim())
    .filter((t) => t.length > 20);
  return {
    title: document.title,
    content: [...headings, ...paragraphs].join('\n').slice(0, 3000)
  };
}

async function regroupAllOpenTabs() {
  const settings = await getSettings();
  const tabs = await chrome.tabs.query({});

  for (const tab of tabs) {
    if (!tab.url || !/^https?:/.test(tab.url) || tabInfoById.has(tab.id)) continue;

    const domain = getDomain(tab.url);
    if (isIgnoredDomain(domain, settings.ignoredDomains)) continue;

    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: inlineFallbackExtraction
      });
      if (result?.content) {
        await handlePageContent(tab.id, { url: tab.url, title: result.title, content: result.content });
      }
    } catch (err) {
      console.warn(`[Semantic Tab Grouper] Não foi possível processar a aba ${tab.id}:`, err);
    }
  }

  // Segunda passada: agora que todas as abas têm vetor, tenta reagrupar os pares restantes.
  for (const [tabId, info] of tabInfoById) {
    await decideGrouping(tabId, info, settings);
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  updateBadge();
  const settings = await getSettings();
  console.log('[Semantic Tab Grouper] instalado. Configurações atuais:', settings);
});
