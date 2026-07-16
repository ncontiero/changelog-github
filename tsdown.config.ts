import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  outDir: "dist",
  exports: true,
  clean: true,
  sourcemap: true,
  format: "esm",
  target: "esnext",
});
