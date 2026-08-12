import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

function capacitorIndexHtml(): Plugin {
  return {
    name: "capacitor-index-html",
    generateBundle(_options, bundle) {
      const entry = bundle["mobile.html"];
      if (!entry || entry.type !== "asset") return;
      delete bundle["mobile.html"];
      entry.fileName = "index.html";
      bundle["index.html"] = entry;
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
    capacitorIndexHtml(),
  ],
  define: {
    "import.meta.env.VITE_MOBILE": JSON.stringify("true"),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(process.cwd(), "mobile.html"),
    },
  },
});