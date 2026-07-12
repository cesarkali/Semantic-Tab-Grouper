import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json' with { type: 'json' };

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        // offscreen.html não é referenciado no manifest.json (é criado
        // dinamicamente via chrome.offscreen.createDocument), então
        // precisa ser adicionado manualmente como entry point do build.
        offscreen: 'src/offscreen/offscreen.html'
      }
    }
  },
  // @xenova/transformers baixa/roda arquivos wasm e não deve ser
  // pré-empacotado pelo esbuild do dev server.
  optimizeDeps: {
    exclude: ['@xenova/transformers']
  }
});
