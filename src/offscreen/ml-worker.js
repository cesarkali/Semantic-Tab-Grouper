import { pipeline, env } from '@xenova/transformers';

// Modelos são baixados do CDN da Hugging Face e cacheados pelo próprio
// navegador (Cache Storage); não há execução de código remoto, apenas pesos
// e WASM, o que é permitido pela política do MV3.
env.allowLocalModels = false;

// Por padrão o onnxruntime-web tenta rodar o WASM num worker "proxy",
// criado via blob: URL que faz importScripts() de outro blob — e a CSP de
// extension_pages do MV3 não permite scripts blob:, o que quebra a
// inferência com "Failed to execute 'importScripts'". Desativando o proxy,
// o WASM roda direto no offscreen document, sem precisar desse worker.
env.backends.onnx.wasm.proxy = false;
env.backends.onnx.wasm.numThreads = 1;

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

let extractorPromise = null;

function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', MODEL_NAME);
  }
  return extractorPromise;
}

async function generateEmbedding(text) {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.target !== 'offscreen') return false;

  if (message.type === 'GENERATE_EMBEDDING') {
    generateEmbedding(message.payload.text)
      .then((vector) => sendResponse({ ok: true, vector }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true; // resposta assíncrona
  }

  if (message.type === 'WARM_UP') {
    getExtractor()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  return false;
});
