import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Docker-friendly server settings
    host: "0.0.0.0",
    port: 3000,
    // Proxy for API requests
    proxy: {
      "/api": {
        target: "http://backend:8000",
        changeOrigin: true,
        // KLUCZOWA POPRAWKA: usuwamy /api ze ścieżki
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  build: {
    outDir: "build",
  },
});
