import { getSettings, saveSettings } from '../utils/storage.js';

const enabledToggle = document.getElementById('enabled');
const regroupBtn = document.getElementById('regroup');
const statusEl = document.getElementById('status');
const openOptionsLink = document.getElementById('open-options');
const suggestionsEl = document.getElementById('suggestions');
const suggestionsLabel = document.getElementById('suggestions-label');

async function loadSuggestions() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_SUGGESTIONS' });
  const suggestions = response?.suggestions || [];

  suggestionsLabel.textContent = suggestions.length ? `Sugestões (${suggestions.length})` : 'Sugestões';
  suggestionsEl.innerHTML = '';

  if (suggestions.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Nenhuma sugestão no momento. O detector avisa aqui assim que encontrar abas parecidas.';
    suggestionsEl.appendChild(empty);
    return;
  }

  suggestions.forEach((s) => {
    const card = document.createElement('div');
    card.className = 'suggestion-card';
    card.dataset.id = s.id;
    card.innerHTML = `
      <div class="suggestion-top">
        <span class="suggestion-dot" style="background:var(--g-${s.color}, ${s.color})"></span>
        <span class="suggestion-label">${escapeHtml(s.label)}</span>
        <span class="suggestion-count">${s.tabCount} abas</span>
      </div>
      <div class="suggestion-titles">${escapeHtml(s.tabTitles.join(' · '))}</div>
      <div class="suggestion-actions">
        <button data-action="dismiss" data-id="${s.id}">Ignorar</button>
        <button data-action="edit" data-id="${s.id}">Editar</button>
        <button class="accept" data-action="apply" data-id="${s.id}">Agrupar</button>
      </div>
    `;
    suggestionsEl.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function openEditor(card, id) {
  const response = await chrome.runtime.sendMessage({ type: 'GET_SUGGESTION_EDIT_OPTIONS', payload: { id } });
  if (!response?.ok) {
    statusEl.textContent = `Erro: ${response?.error}`;
    return;
  }

  const { included, available } = response;
  const rows = [...included, ...available]
    .map(
      (tab) => `
        <label class="edit-row">
          <input type="checkbox" value="${tab.tabId}" ${included.some((t) => t.tabId === tab.tabId) ? 'checked' : ''} />
          <span>${escapeHtml(tab.title)}</span>
        </label>`
    )
    .join('');

  card.innerHTML = `
    <div class="edit-panel">
      <p class="edit-hint">Marque as abas que devem entrar no grupo:</p>
      <div class="edit-list">${rows}</div>
      <div class="suggestion-actions">
        <button data-action="cancel-edit" data-id="${id}">Cancelar</button>
        <button class="accept" data-action="save-edit" data-id="${id}">Salvar</button>
      </div>
    </div>
  `;
}

suggestionsEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const id = btn.getAttribute('data-id');
  const action = btn.getAttribute('data-action');
  const card = btn.closest('.suggestion-card');

  if (action === 'edit') {
    await openEditor(card, id);
    return;
  }

  if (action === 'cancel-edit') {
    await loadSuggestions();
    return;
  }

  if (action === 'save-edit') {
    const tabIds = [...card.querySelectorAll('.edit-list input[type="checkbox"]:checked')].map((el) => Number(el.value));
    btn.disabled = true;
    const response = await chrome.runtime.sendMessage({ type: 'UPDATE_SUGGESTION', payload: { id, tabIds } });
    if (!response?.ok) {
      statusEl.textContent = `Erro: ${response?.error}`;
      btn.disabled = false;
      return;
    }
    await loadSuggestions();
    return;
  }

  card.querySelectorAll('button').forEach((b) => (b.disabled = true));
  const type = action === 'apply' ? 'APPLY_SUGGESTION' : 'DISMISS_SUGGESTION';
  await chrome.runtime.sendMessage({ type, payload: { id } });
  await loadSuggestions();
});

async function init() {
  const settings = await getSettings();
  enabledToggle.checked = settings.enabled;
  await loadSuggestions();
}

enabledToggle.addEventListener('change', async () => {
  await saveSettings({ enabled: enabledToggle.checked });
});

regroupBtn.addEventListener('click', async () => {
  regroupBtn.disabled = true;
  statusEl.textContent = 'Analisando abas abertas…';
  try {
    const response = await chrome.runtime.sendMessage({ type: 'REGROUP_NOW' });
    statusEl.textContent = response?.ok ? 'Pronto — veja as sugestões acima.' : `Erro: ${response?.error}`;
    await loadSuggestions();
  } catch (err) {
    statusEl.textContent = `Erro: ${err.message}`;
  } finally {
    regroupBtn.disabled = false;
  }
});

openOptionsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

init();
