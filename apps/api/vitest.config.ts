import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig } from "@starter/vitest-config/base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ["test/**/*.test.ts"],
    },
  })
);
