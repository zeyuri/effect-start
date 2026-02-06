import { defineRule } from "oxlint";
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid classes except Effect service tags, error classes, and Schema classes",
    },
    messages: {
      noClasses:
        "Classes are forbidden in functional programming. Only Effect service tags (extending Context.Tag, Effect.Tag, or Context.GenericTag), error classes (extending Data.TaggedError), and Schema classes (extending Schema.Class) are allowed.",
    },
    schema: [],
  },

  createOnce(context) {
    const allowedMemberExpressions = [
      { object: "Data", property: "TaggedError" },
      { object: "Schema", property: "Class" },
    ];

    const allowedCallExpressions = [
      { object: "Context", property: "Tag" },
      { object: "Effect", property: "Tag" },
      { object: "Context", property: "GenericTag" },
      { object: "Data", property: "TaggedError" },
      { object: "Schema", property: "Class" },
      { object: "Schema", property: "TaggedError" },
    ];

    // Factory patterns that produce chainable builders (e.g. HttpApiGroup.make(...).add(...))
    const allowedFactories = [
      { object: "HttpApiGroup", property: "make" },
      { object: "HttpApi", property: "make" },
    ];

    const isAllowedPair = (list, object, property) =>
      list.some((a) => object === a.object && property === a.property);

    // Walk a method chain (CallExpr → MemberExpr.object → CallExpr → …)
    // to find the root factory MemberExpression (e.g. HttpApiGroup.make).
    const findRootFactory = (node) => {
      let current = node;
      while (current) {
        if (
          current.type === "MemberExpression" &&
          current.object?.type === "Identifier"
        ) {
          return {
            object: current.object.name,
            property: current.property?.name,
          };
        }
        if (current.type === "CallExpression") {
          current = current.callee;
        } else if (current.type === "MemberExpression") {
          current = current.object;
        } else {
          break;
        }
      }
      return null;
    };

    return {
      ClassDeclaration(node) {
        const superClass = node.superClass;

        if (superClass) {
          // Pattern: extends Data.TaggedError or Schema.Class (direct member expression)
          if (superClass.type === "MemberExpression") {
            const object = superClass.object?.name;
            const property = superClass.property?.name;
            if (isAllowedPair(allowedMemberExpressions, object, property)) {
              return;
            }
          }

          // Pattern: extends Context.Tag(...), Schema.TaggedError<T>()(), etc.
          if (superClass.type === "CallExpression") {
            let callee = superClass.callee;

            // Curried/generic: Schema.TaggedError<T>()() or Context.Tag(...)()
            if (
              callee.type === "CallExpression" &&
              callee.callee?.type === "MemberExpression"
            ) {
              const object = callee.callee.object?.name;
              const property = callee.callee.property?.name;
              if (isAllowedPair(allowedCallExpressions, object, property)) {
                return;
              }
            }

            // Direct call: Context.Tag(...) or Data.TaggedError(...)
            if (callee.type === "MemberExpression") {
              const object = callee.object?.name;
              const property = callee.property?.name;
              if (isAllowedPair(allowedCallExpressions, object, property)) {
                return;
              }
            }

            // Chained builder: HttpApiGroup.make(...).add(...).add(...)
            const root = findRootFactory(superClass);
            if (
              root &&
              isAllowedPair(allowedFactories, root.object, root.property)
            ) {
              return;
            }
          }
        }

        context.report({
          node,
          messageId: "noClasses",
        });
      },
    };
  },
});
