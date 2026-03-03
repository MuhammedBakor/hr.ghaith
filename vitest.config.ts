import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json"],
      reportsDirectory: "./coverage",
      include: ["server/db/**/*.ts", "server/_core/**/*.ts", "server/routers/**/*.ts"],
      exclude: [
        "server/**/*.test.ts",
        "server/**/_archive*/**",
        "server/**/*.spec.ts",
        "server/db/_mixed_catchall.ts",  // refactor pending
      ],
      // v82: رفع العتبات تدريجياً — الهدف النهائي: 70%+ لكل مقياس
      thresholds: {
        statements: 65,
        branches: 60,
        functions: 65,
        lines: 65,
      },
    },
  },
});
