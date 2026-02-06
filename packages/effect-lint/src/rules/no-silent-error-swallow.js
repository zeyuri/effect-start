import { defineRule } from "oxlint";
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Ban () => Effect.void / () => Effect.unit in catch handlers",
    },
    messages: {
      noSilentErrorSwallow:
        "Do not silently swallow errors with '() => Effect.void'. Errors must be handled explicitly.",
    },
    schema: [],
  },

  createOnce(context) {
    const catchMethods = new Set(["catchTag", "catchAll", "catchTags"]);

    const silentReturns = new Set(["void", "unit"]);

    const isSilentHandler = (node) => {
      if (node.type !== "ArrowFunctionExpression") return false;
      const body = node.body;
      if (
        body?.type === "MemberExpression" &&
        body.object?.type === "Identifier" &&
        body.object.name === "Effect" &&
        body.property?.type === "Identifier" &&
        silentReturns.has(body.property.name)
      ) {
        return true;
      }
      return false;
    };

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee?.type !== "MemberExpression") return;
        if (callee.object?.type !== "Identifier") return;
        if (callee.object.name !== "Effect") return;
        if (callee.property?.type !== "Identifier") return;
        if (!catchMethods.has(callee.property.name)) return;

        for (const arg of node.arguments) {
          if (isSilentHandler(arg)) {
            context.report({
              node: arg,
              messageId: "noSilentErrorSwallow",
            });
          }
        }
      },
    };
  },
});
