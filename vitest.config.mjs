import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/globalecon/setup.ts"],
    include: ["tests/globalecon/**/*.test.ts", "tests/globalecon/**/*.test.tsx"],
    css: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
