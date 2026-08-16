import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "@tanstack/react-router": resolve(process.cwd(), "src/mobile-router-shim.tsx"),
    },
  },
  define: {
    "import.meta.env.VITE_MOBILE": JSON.stringify("true"),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
