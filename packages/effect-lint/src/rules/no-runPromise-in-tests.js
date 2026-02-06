import { defineRule } from "oxlint";
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid Effect.runPromise() in test files. Use it.effect() from @effect/vitest instead.",
    },
    messages: {
      noRunPromiseInTests:
        "Use it.effect() from @effect/vitest instead of Effect.runPromise() in tests.",
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
          node.callee.property.name === "runPromise"
        ) {
          context.report({
            node,
            messageId: "noRunPromiseInTests",
          });
        }
      },
    };
  },
});
