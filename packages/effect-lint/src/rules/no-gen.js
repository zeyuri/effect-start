import { defineRule } from "oxlint";
export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description: "Forbid Effect.gen in favor of pipe composition",
    },
    messages: {
      noGen:
        "Effect.gen is forbidden. Use pipe and Effect.all/Effect.forEach instead.",
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
          node.callee.property.name === "gen"
        ) {
          context.report({
            node,
            messageId: "noGen",
          });
        }
      },
    };
  },
});
