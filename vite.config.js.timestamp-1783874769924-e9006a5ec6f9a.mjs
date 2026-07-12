// vite.config.js
import { defineConfig } from "file:///C:/Dev/agrupador/node_modules/vite/dist/node/index.js";
import { crx } from "file:///C:/Dev/agrupador/node_modules/@crxjs/vite-plugin/dist/index.mjs";

// manifest.json
var manifest_default = {
  manifest_version: 3,
  name: "Semantic Tab Grouper",
  version: "0.1.0",
  description: "Agrupa abas automaticamente por similaridade sem\xE2ntica de conte\xFAdo (n\xE3o apenas por dom\xEDnio), usando embeddings on-device.",
  permissions: [
    "tabs",
    "tabGroups",
    "scripting",
    "offscreen",
    "storage"
  ],
  host_permissions: [
    "<all_urls>"
  ],
  background: {
    service_worker: "src/background/service-worker.js",
    type: "module"
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/extractor.js"],
      run_at: "document_idle"
    }
  ],
  action: {
    default_title: "Semantic Tab Grouper"
  }
};

// vite.config.js
var vite_config_default = defineConfig({
  plugins: [crx({ manifest: manifest_default })],
  build: {
    rollupOptions: {
      input: {
        // offscreen.html não é referenciado no manifest.json (é criado
        // dinamicamente via chrome.offscreen.createDocument), então
        // precisa ser adicionado manualmente como entry point do build.
        offscreen: "src/offscreen/offscreen.html"
      }
    }
  },
  // @xenova/transformers baixa/roda arquivos wasm e não deve ser
  // pré-empacotado pelo esbuild do dev server.
  optimizeDeps: {
    exclude: ["@xenova/transformers"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAibWFuaWZlc3QuanNvbiJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXERldlxcXFxhZ3J1cGFkb3JcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXERldlxcXFxhZ3J1cGFkb3JcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L0Rldi9hZ3J1cGFkb3Ivdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB7IGNyeCB9IGZyb20gJ0Bjcnhqcy92aXRlLXBsdWdpbic7XG5pbXBvcnQgbWFuaWZlc3QgZnJvbSAnLi9tYW5pZmVzdC5qc29uJyB3aXRoIHsgdHlwZTogJ2pzb24nIH07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtjcngoeyBtYW5pZmVzdCB9KV0sXG4gIGJ1aWxkOiB7XG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgaW5wdXQ6IHtcbiAgICAgICAgLy8gb2Zmc2NyZWVuLmh0bWwgblx1MDBFM28gXHUwMEU5IHJlZmVyZW5jaWFkbyBubyBtYW5pZmVzdC5qc29uIChcdTAwRTkgY3JpYWRvXG4gICAgICAgIC8vIGRpbmFtaWNhbWVudGUgdmlhIGNocm9tZS5vZmZzY3JlZW4uY3JlYXRlRG9jdW1lbnQpLCBlbnRcdTAwRTNvXG4gICAgICAgIC8vIHByZWNpc2Egc2VyIGFkaWNpb25hZG8gbWFudWFsbWVudGUgY29tbyBlbnRyeSBwb2ludCBkbyBidWlsZC5cbiAgICAgICAgb2Zmc2NyZWVuOiAnc3JjL29mZnNjcmVlbi9vZmZzY3JlZW4uaHRtbCdcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIC8vIEB4ZW5vdmEvdHJhbnNmb3JtZXJzIGJhaXhhL3JvZGEgYXJxdWl2b3Mgd2FzbSBlIG5cdTAwRTNvIGRldmUgc2VyXG4gIC8vIHByXHUwMEU5LWVtcGFjb3RhZG8gcGVsbyBlc2J1aWxkIGRvIGRldiBzZXJ2ZXIuXG4gIG9wdGltaXplRGVwczoge1xuICAgIGV4Y2x1ZGU6IFsnQHhlbm92YS90cmFuc2Zvcm1lcnMnXVxuICB9XG59KTtcbiIsICJ7XG4gIFwibWFuaWZlc3RfdmVyc2lvblwiOiAzLFxuICBcIm5hbWVcIjogXCJTZW1hbnRpYyBUYWIgR3JvdXBlclwiLFxuICBcInZlcnNpb25cIjogXCIwLjEuMFwiLFxuICBcImRlc2NyaXB0aW9uXCI6IFwiQWdydXBhIGFiYXMgYXV0b21hdGljYW1lbnRlIHBvciBzaW1pbGFyaWRhZGUgc2VtXHUwMEUybnRpY2EgZGUgY29udGVcdTAwRkFkbyAoblx1MDBFM28gYXBlbmFzIHBvciBkb21cdTAwRURuaW8pLCB1c2FuZG8gZW1iZWRkaW5ncyBvbi1kZXZpY2UuXCIsXG4gIFwicGVybWlzc2lvbnNcIjogW1xuICAgIFwidGFic1wiLFxuICAgIFwidGFiR3JvdXBzXCIsXG4gICAgXCJzY3JpcHRpbmdcIixcbiAgICBcIm9mZnNjcmVlblwiLFxuICAgIFwic3RvcmFnZVwiXG4gIF0sXG4gIFwiaG9zdF9wZXJtaXNzaW9uc1wiOiBbXG4gICAgXCI8YWxsX3VybHM+XCJcbiAgXSxcbiAgXCJiYWNrZ3JvdW5kXCI6IHtcbiAgICBcInNlcnZpY2Vfd29ya2VyXCI6IFwic3JjL2JhY2tncm91bmQvc2VydmljZS13b3JrZXIuanNcIixcbiAgICBcInR5cGVcIjogXCJtb2R1bGVcIlxuICB9LFxuICBcImNvbnRlbnRfc2NyaXB0c1wiOiBbXG4gICAge1xuICAgICAgXCJtYXRjaGVzXCI6IFtcIjxhbGxfdXJscz5cIl0sXG4gICAgICBcImpzXCI6IFtcInNyYy9jb250ZW50L2V4dHJhY3Rvci5qc1wiXSxcbiAgICAgIFwicnVuX2F0XCI6IFwiZG9jdW1lbnRfaWRsZVwiXG4gICAgfVxuICBdLFxuICBcImFjdGlvblwiOiB7XG4gICAgXCJkZWZhdWx0X3RpdGxlXCI6IFwiU2VtYW50aWMgVGFiIEdyb3VwZXJcIlxuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXdPLFNBQVMsb0JBQW9CO0FBQ3JRLFNBQVMsV0FBVzs7O0FDRHBCO0FBQUEsRUFDRSxrQkFBb0I7QUFBQSxFQUNwQixNQUFRO0FBQUEsRUFDUixTQUFXO0FBQUEsRUFDWCxhQUFlO0FBQUEsRUFDZixhQUFlO0FBQUEsSUFDYjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBQUEsRUFDQSxrQkFBb0I7QUFBQSxJQUNsQjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFlBQWM7QUFBQSxJQUNaLGdCQUFrQjtBQUFBLElBQ2xCLE1BQVE7QUFBQSxFQUNWO0FBQUEsRUFDQSxpQkFBbUI7QUFBQSxJQUNqQjtBQUFBLE1BQ0UsU0FBVyxDQUFDLFlBQVk7QUFBQSxNQUN4QixJQUFNLENBQUMsMEJBQTBCO0FBQUEsTUFDakMsUUFBVTtBQUFBLElBQ1o7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFVO0FBQUEsSUFDUixlQUFpQjtBQUFBLEVBQ25CO0FBQ0Y7OztBRHpCQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsSUFBSSxFQUFFLDJCQUFTLENBQUMsQ0FBQztBQUFBLEVBQzNCLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQTtBQUFBO0FBQUE7QUFBQSxRQUlMLFdBQVc7QUFBQSxNQUNiO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUEsRUFHQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsc0JBQXNCO0FBQUEsRUFDbEM7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
