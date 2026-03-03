import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";
// import { mockApiPlugin } from './vite-mock-api';

// vite.config.ts is now at: frontend/vite.config.ts
// Root of the monorepo is one level up: ../
const ROOT = path.resolve(import.meta.dirname, "..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ROOT, "");
  const isMock = env.VITE_MOCK_API === "true";

  const plugins: any[] = [react(), tailwindcss()];

  // if (isMock) {
  //   plugins.push(mockApiPlugin());
  //   console.log("\n🎭  MOCK API mode — running frontend without backend\n");
  // }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(ROOT, "shared"),
        "@assets": path.resolve(ROOT, "attached_assets"),
      },
    },
    // .env lives at the monorepo root
    envDir: ROOT,
    root: path.resolve(import.meta.dirname, "client"),
    publicDir: path.resolve(import.meta.dirname, "client", "public"),
    build: {
      outDir: path.resolve(ROOT, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      host: true,
      allowedHosts: ["localhost", "127.0.0.1"],
      fs: {
        strict: false, // allow serving files from root (shared/)
        deny: ["**/.*"],
      },
    },
  };
});
