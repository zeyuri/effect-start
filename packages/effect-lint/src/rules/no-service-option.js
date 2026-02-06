import { defineRule } from "oxlint";
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Ban Effect.serviceOption() usage",
    },
    messages: {
      noServiceOption:
        "Do not use Effect.serviceOption. Services should always be present in context.",
    },
    schema: [],
  },

  createOnce(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee?.type === "MemberExpression" &&
          callee.object?.type === "Identifier" &&
          callee.object.name === "Effect" &&
          callee.property?.type === "Identifier" &&
          callee.property.name === "serviceOption"
        ) {
          context.report({
            node,
            messageId: "noServiceOption",
          });
        }
      },
    };
  },
});
