import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import simpleApiMiddleware from "./vite-api-middleware";

export default defineConfig({
  plugins: [react(), tailwindcss(), simpleApiMiddleware()],
  server: {
    port: 5125,
    open: true,
    host: true,
  },
  build: {
    outDir: "dist",
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
