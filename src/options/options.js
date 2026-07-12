import { getSettings, saveSettings, clearEmbeddingCache } from '../utils/storage.js';

const enabledToggle = document.getElementById('enabled');
const thresholdInput = document.getElementById('threshold');
const thresholdValue = document.getElementById('threshold-value');
const thresholdLink = document.getElementById('threshold-link');
const thresholdSimLabel = document.getElementById('threshold-sim-label');
const ignoredDomainsInput = document.getElementById('ignored-domains');
const ignoredChips = document.getElementById('ignored-chips');
const savebar = document.getElementById('savebar');
const saveBtn = document.getElementById('save');
const clearCacheBtn = document.getElementById('clear-cache');
const toast = document.getElementById('toast');

let loaded = null;

function currentFormState() {
  return {
    enabled: enabledToggle.checked,
    suggestOnly: (document.querySelector('input[name="apply-mode"]:checked')?.value || 'suggest') === 'suggest',
    mode: document.querySelector('input[name="mode"]:checked')?.value || 'semantic',
    threshold: Number(thresholdInput.value),
    ignoredDomains: ignoredDomainsInput.value
      .split('\n')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean),
    minGroupSize: Number(document.querySelector('input[name="mgs"]:checked')?.value || 2)
  };
}

function isDirty() {
  if (!loaded) return false;
  const current = currentFormState();
  return (
    current.enabled !== loaded.enabled ||
    current.suggestOnly !== loaded.suggestOnly ||
    current.mode !== loaded.mode ||
    current.threshold !== loaded.threshold ||
    current.minGroupSize !== loaded.minGroupSize ||
    current.ignoredDomains.join('\n') !== loaded.ignoredDomains.join('\n')
  );
}

function refreshDirtyState() {
  savebar.classList.toggle('visible', isDirty());
}

function renderThresholdVisual(value) {
  thresholdValue.textContent = value.toFixed(2);
  thresholdSimLabel.textContent = `similaridade ${value.toFixed(2)}`;
  // abaixo do threshold => visual mais apagado (não conectaria); acima => bem visível
  thresholdLink.style.opacity = String(0.25 + value * 0.75);
}

function renderChips() {
  const domains = ignoredDomainsInput.value
    .split('\n')
    .map((d) => d.trim())
    .filter(Boolean);
  ignoredChips.innerHTML = '';
  domains.forEach((domain) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = domain;
    ignoredChips.appendChild(chip);
  });
}

function setMode(mode) {
  const input = document.querySelector(`input[name="mode"][value="${mode}"]`);
  if (input) input.checked = true;
}

function setApplyMode(suggestOnly) {
  const input = document.querySelector(`input[name="apply-mode"][value="${suggestOnly ? 'suggest' : 'auto'}"]`);
  if (input) input.checked = true;
}

function setMinGroupSize(size) {
  const input = document.querySelector(`input[name="mgs"][value="${size}"]`);
  if (input) input.checked = true;
}

async function load() {
  const settings = await getSettings();
  loaded = settings;

  enabledToggle.checked = settings.enabled;
  setApplyMode(settings.suggestOnly);
  setMode(settings.mode);
  thresholdInput.value = settings.threshold;
  renderThresholdVisual(settings.threshold);
  ignoredDomainsInput.value = settings.ignoredDomains.join('\n');
  renderChips();
  setMinGroupSize(settings.minGroupSize);

  refreshDirtyState();
}

thresholdInput.addEventListener('input', () => {
  renderThresholdVisual(Number(thresholdInput.value));
  refreshDirtyState();
});

ignoredDomainsInput.addEventListener('input', () => {
  renderChips();
  refreshDirtyState();
});

document.querySelectorAll('input[name="mode"], input[name="mgs"], input[name="apply-mode"]').forEach((input) => {
  input.addEventListener('change', refreshDirtyState);
});
enabledToggle.addEventListener('change', refreshDirtyState);

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2200);
}

saveBtn.addEventListener('click', async () => {
  const next = await saveSettings(currentFormState());
  loaded = next;
  refreshDirtyState();
  showToast('Configurações salvas');
});

clearCacheBtn.addEventListener('click', async () => {
  await clearEmbeddingCache();
  showToast('Cache de embeddings limpo');
});

load();
