import { defineRule } from "oxlint";
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Ban { disableValidation: true } in Schema operations",
    },
    messages: {
      noDisableValidation:
        "Do not use { disableValidation: true }. Schema validation should always be enabled.",
    },
    schema: [],
  },

  createOnce(context) {
    return {
      Property(node) {
        if (
          node.key?.type === "Identifier" &&
          node.key.name === "disableValidation" &&
          node.value?.type === "Literal" &&
          node.value.value === true
        ) {
          context.report({
            node,
            messageId: "noDisableValidation",
          });
        }
      },
    };
  },
});
