import type { Options } from "tsup";
import { defineConfig } from "tsup";
import { configOptions as baseConfigOptions } from "./tsup.config";

const configOptions: Options = {
  ...baseConfigOptions,
  outDir: "node_modules/@dkshs/changelog-github/dist",
};

export default defineConfig(configOptions);
