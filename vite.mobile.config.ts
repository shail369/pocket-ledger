import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  define: {
    "import.meta.env.VITE_MOBILE": JSON.stringify("true"),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
