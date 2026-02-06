import { defineRule } from "oxlint";
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid Effect.runSync() in test files. Use it.effect() from @effect/vitest instead.",
    },
    messages: {
      noRunSyncInTests:
        "Use it.effect() from @effect/vitest instead of Effect.runSync() in tests.",
    },
    schema: [],
  },

  createOnce(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.type === "Identifier" &&
          node.callee.object.name === "Effect" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "runSync"
        ) {
          context.report({
            node,
            messageId: "noRunSyncInTests",
          });
        }
      },
    };
  },
});
