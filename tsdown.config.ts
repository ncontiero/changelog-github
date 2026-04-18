import { type UserConfig as Options, defineConfig } from "tsdown";

export const configOptions: Options = {
  clean: true,
  entry: ["src/index.ts"],
  format: ["cjs"],
  sourcemap: true,
  target: "esnext",
  outDir: "dist",
};

export default defineConfig([
  configOptions,
  {
    ...configOptions,
    outDir: "node_modules/@ncontiero/changelog-github/dist",
    onSuccess:
      "copyfiles ./package.json ./node_modules/@ncontiero/changelog-github",
  },
]);
