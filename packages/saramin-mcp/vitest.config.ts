import { transformWithEsbuild } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { target: "node22" },
  oxc: false,
  plugins: [
    {
      name: "transform-standard-decorators",
      enforce: "pre",
      transform(code, id) {
        if (id.includes("/src/") && id.endsWith(".ts")) {
          return transformWithEsbuild(code, id, { target: "node22" });
        }
      },
    },
  ],
  test: {
    include: ["test/**/*.test.ts"],
  },
});
