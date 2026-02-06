import { definePlugin } from "oxlint";
import rules from "./rules/index.js";
import {
  functionalImmutabilityRules,
  pluginRules,
  recommended,
  strict,
  noGen,
  preferMatch,
  pipeStrict,
  testing,
} from "./configs.js";

const plugin = definePlugin({
  rules,
  meta: {
    name: "effect",
    version: "0.1.0",
  },
});

const configs = {
  functionalImmutabilityRules,
  plugin: pluginRules(),
  recommended: recommended(),
  strict: strict(),
  noGen: noGen(),
  preferMatch: preferMatch(),
  pipeStrict: pipeStrict(),
  testing: testing(),
};

export { rules, functionalImmutabilityRules };

export default {
  ...plugin,
  configs,
};
