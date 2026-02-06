// Core Effect best practices - universally recommended (now as named rules)
const effectRecommendedRules = {
  "effect/no-classes": "error",
  "effect/no-runSync": "error",
  "effect/no-runPromise": "error",
  "effect/prefer-andThen": "error",
  "effect/prefer-as": "error",
  "effect/prefer-effect-platform": "error",
};

// Opinionated: forbid Effect.gen in favor of pipe composition
const noGenRules = {
  "effect/no-gen": "error",
};

// Opinionated: prefer Match over direct _tag access (now as named rules)
const preferMatchRules = {
  "effect/no-direct-tag-access": "error",
  "effect/no-switch-statement": "error",
  "effect/no-if-statement": "error",
};

// Basic pipe best practices - less controversial (now as named rules)
const pipeRecommendedRules = {
  "effect/no-method-pipe": "error",
  "effect/no-curried-calls": "error",
  "effect/no-identity-transform": "error",
  "effect/no-pipe-first-arg-call": "error",
};

// Opinionated: strict pipe composition rules (now as named rules)
const pipeStrictRules = {
  "effect/no-nested-pipe": "error",
  "effect/no-nested-pipes": "error",
  "effect/no-intermediate-effect-variables": "error",
};

export const functionalImmutabilityRules = {
  "functional/prefer-immutable-types": [
    "error",
    {
      enforcement: "ReadonlyShallow",
      ignoreInferredTypes: true,
      ignoreTypePattern: [
        // Effect types are immutable-by-contract but contain internal mutable state
        "^Ref\\.Ref<.*>$",
        "^Queue\\.Queue<.*>$",
        "^HashMap\\.HashMap<.*>$",
        "^HashSet\\.HashSet<.*>$",
        "^Stream\\.Stream<.*>$",
        "^PubSub\\.PubSub<.*>$",
        // Bun types wrapped in ReadonlyDeep are treated as immutable at boundaries
        "ServerWebSocket<.*>$",
        // Built-in types wrapped in ReadonlyDeep are treated as immutable
        "^ReadonlyDeep<Date>$",
      ],
      parameters: {
        // Use ReadonlyShallow for parameters because Effect types contain internal
        // mutable state. ReadonlyShallow ensures readonly wrappers while allowing
        // Effect types within the structure.
        enforcement: "ReadonlyShallow",
      },
    },
  ],
  "functional/type-declaration-immutability": [
    "error",
    {
      rules: [
        {
          identifiers: ["I.+"],
          immutability: "ReadonlyDeep",
          comparator: "AtLeast",
        },
      ],
      ignoreIdentifierPattern: [
        // Interfaces/types containing Effect/Schema types which are immutable-by-contract
        ".*Internal.*",
        ".*State",
        ".*Store",
        "Incoming.*",
      ],
    },
  ],
  "functional/no-let": "error",
  "functional/immutable-data": [
    "error",
    {
      ignoreImmediateMutation: true,
      ignoreClasses: true,
      ignoreAccessorPattern: ["draft.**", "**.draft"],
    },
  ],
  "functional/prefer-readonly-type": "error",
  "functional/no-method-signature": "off",
  "functional/no-mixed-types": "off",
  "functional/no-return-void": "off",
  "functional/functional-parameters": "off",
  "functional/no-expression-statements": "off",
  "functional/no-conditional-statements": "off",
  "functional/no-loop-statements": "error",
};

// Plugin rules only
const pluginRulesOnly = {
  "effect/no-unnecessary-pipe-wrapper": "error",
  "effect/no-eta-expansion": "error",
  "effect/no-unnecessary-function-alias": "warn",
  "effect/prefer-match-tag": "error",
  "effect/prefer-match-over-conditionals": "error",
  "effect/prefer-match-over-ternary": "error",
  "effect/prefer-effect-if-over-match-boolean": "error",
  "effect/prefer-schema-validation-over-assertions": "error",
  "effect/prefer-as-void": "error",
  "effect/prefer-as-some": "error",
  "effect/prefer-as-some-error": "error",
  "effect/prefer-flatten": "error",
  "effect/prefer-zip-left": "error",
  "effect/prefer-zip-right": "error",
  "effect/prefer-ignore": "error",
  "effect/prefer-ignore-logged": "error",
  "effect/prefer-from-nullable": "error",
  "effect/prefer-get-or-else": "error",
  "effect/prefer-get-or-null": "error",
  "effect/prefer-get-or-undefined": "error",
  "effect/prefer-succeed-none": "error",
  "effect/no-effect-if-option-check": "error",
  "effect/suggest-currying-opportunity": "warn",
  "effect/no-disable-validation": "error",
  "effect/no-silent-error-swallow": "error",
  "effect/no-effect-catchallcause": "error",
  "effect/no-service-option": "error",
  "effect/no-nested-layer-provide": "error",
  "effect/pipe-max-arguments": "error",
};

// Recommended: Core Effect + basic pipe best practices
const recommendedRulesOnly = {
  ...pluginRulesOnly,
  ...effectRecommendedRules,
  ...pipeRecommendedRules,
};

// Strict: Recommended + no-gen + prefer-match + strict-pipe
const strictRulesOnly = {
  ...pluginRulesOnly,
  ...effectRecommendedRules,
  ...noGenRules,
  ...preferMatchRules,
  ...pipeRecommendedRules,
  ...pipeStrictRules,
};

// Individual opt-in configs
const noGenRulesOnly = {
  ...noGenRules,
};

const preferMatchRulesOnly = {
  ...preferMatchRules,
};

const pipeStrictRulesOnly = {
  ...pipeStrictRules,
};

// Testing-specific rules for @effect/vitest
const testingRules = {
  "effect/no-runPromise-in-tests": "error",
  "effect/no-runSync-in-tests": "error",
  "effect/prefer-effect-assertions": "warn",
};

// Exported configs
export const pluginRules = () => ({
  name: "@zeyuri/effect-lint/plugin",
  rules: pluginRulesOnly,
});

export const recommended = () => ({
  name: "@zeyuri/effect-lint/recommended",
  rules: recommendedRulesOnly,
});

export const strict = () => ({
  name: "@zeyuri/effect-lint/strict",
  rules: strictRulesOnly,
});

export const noGen = () => ({
  name: "@zeyuri/effect-lint/no-gen",
  rules: noGenRulesOnly,
});

export const preferMatch = () => ({
  name: "@zeyuri/effect-lint/prefer-match",
  rules: preferMatchRulesOnly,
});

export const pipeStrict = () => ({
  name: "@zeyuri/effect-lint/pipe-strict",
  rules: pipeStrictRulesOnly,
});

export const testing = () => ({
  name: "@zeyuri/effect-lint/testing",
  rules: testingRules,
});
