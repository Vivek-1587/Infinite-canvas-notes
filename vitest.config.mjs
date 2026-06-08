import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: rootDir,
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react"
  },
  test: {
    environment: "jsdom",
    exclude: ["node_modules/**", ".next/**", "tests/e2e/**"],
    globals: true,
    setupFiles: ["./test/setup.ts"],
    css: true,
    coverage: {
      reporter: ["text", "html"],
      include: ["components/**/*.{ts,tsx}", "lib/**/*.ts", "store/**/*.ts"]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, ".")
    }
  }
});
