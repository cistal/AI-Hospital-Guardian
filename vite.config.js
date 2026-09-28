import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" + HashRouter => works on any GitHub Pages URL (project or user site)
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { outDir: "docs", emptyOutDir: true },
  server: { host: true, port: 5173 },
});
