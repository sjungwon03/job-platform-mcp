import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  clean: true,
  sourcemap: true,
  noExternal: ["@job-platform/browser-search-core"],
  external: ["playwright-core"],
});
