import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig } from "@starter/vitest-config/base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ["test/**/*.test.ts"],
      globalSetup: ["./vitest.global-setup.ts"],
      pool: "forks",
      maxWorkers: 1,
      isolate: false,
      hookTimeout: 120_000,
      sequence: {
        hooks: "stack",
      },
    },
  })
);
