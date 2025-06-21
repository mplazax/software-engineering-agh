import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Te ustawienia są nadal przydatne dla lokalnego dewelopmentu w Dockerze
    host: "0.0.0.0",
    port: 3000,
  },
  build: {
    outDir: "build",
  },
});
