import { defineRule } from "oxlint";
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Ban Layer.provide() nested inside another Layer.provide()",
    },
    messages: {
      noNestedLayerProvide:
        "Nested Layer.provide detected. Extract inner to separate variable or use Layer.provideMerge.",
    },
    schema: [],
  },

  createOnce(context) {
    const isLayerProvide = (node) =>
      node.type === "CallExpression" &&
      node.callee?.type === "MemberExpression" &&
      node.callee.object?.type === "Identifier" &&
      node.callee.object.name === "Layer" &&
      node.callee.property?.type === "Identifier" &&
      node.callee.property.name === "provide";

    const containsLayerProvide = (node) => {
      if (!node) return false;
      if (isLayerProvide(node)) return true;
      if (node.type === "CallExpression") {
        return node.arguments.some(containsLayerProvide);
      }
      return false;
    };

    return {
      CallExpression(node) {
        if (!isLayerProvide(node)) return;
        for (const arg of node.arguments) {
          if (containsLayerProvide(arg)) {
            context.report({
              node,
              messageId: "noNestedLayerProvide",
            });
            return;
          }
        }
      },
    };
  },
});
