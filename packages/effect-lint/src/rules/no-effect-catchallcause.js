import { defineRule } from "oxlint";
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Ban Effect.catchAllCause usage",
    },
    messages: {
      noEffectCatchAllCause:
        "Do not use Effect.catchAllCause. It catches defects (bugs) which should crash. Use catchAll or catchTag.",
    },
    schema: [],
  },

  createOnce(context) {
    return {
      MemberExpression(node) {
        if (
          node.object?.type === "Identifier" &&
          node.object.name === "Effect" &&
          node.property?.type === "Identifier" &&
          node.property.name === "catchAllCause"
        ) {
          context.report({
            node,
            messageId: "noEffectCatchAllCause",
          });
        }
      },
    };
  },
});
