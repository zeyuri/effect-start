import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/button.tsx", "./src/card.tsx", "./src/code.tsx"],
  platform: "neutral",
  format: "esm",
  dts: {
    compilerOptions: {
      composite: false,
      declaration: true,
      noEmit: false,
    },
  },
  tsconfig: "./tsconfig.src.json",
});
