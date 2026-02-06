import { defineRule } from "oxlint";
export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description: "Warn when .pipe() has more than 20 arguments",
    },
    messages: {
      pipeMaxArguments:
        ".pipe() has {{ count }} arguments. Split into multiple .pipe() calls (max 20).",
    },
    schema: [],
  },

  createOnce(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee?.type === "MemberExpression" &&
          callee.property?.type === "Identifier" &&
          callee.property.name === "pipe" &&
          node.arguments.length > 20
        ) {
          context.report({
            node,
            messageId: "pipeMaxArguments",
            data: { count: String(node.arguments.length) },
          });
        }
      },
    };
  },
});
