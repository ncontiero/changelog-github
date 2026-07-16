import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  entry: ["src/index.ts"],
  format: ["cjs"],
  sourcemap: true,
  target: "esnext",
  outDir: "dist",
});
