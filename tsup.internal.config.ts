import { type Options, defineConfig } from "tsup";
import { configOptions as baseConfigOptions } from "./tsup.config";

const configOptions: Options = {
  ...baseConfigOptions,
  outDir: "node_modules/@ncontiero/changelog-github/dist",
  onSuccess:
    "copyfiles ./package.json ./node_modules/@ncontiero/changelog-github",
};

export default defineConfig(configOptions);
