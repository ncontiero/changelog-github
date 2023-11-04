import type { Options } from "tsup";
import { defineConfig } from "tsup";

export const configOptions: Options = {
  clean: true,
  dts: true,
  entry: ["src/index.ts"],
  format: ["cjs"],
  sourcemap: true,
  target: "esnext",
  outDir: "dist",
};

export default defineConfig(configOptions);
