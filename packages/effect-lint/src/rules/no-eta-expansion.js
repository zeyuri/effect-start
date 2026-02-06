import { defineRule } from "oxlint";
/**
 * Detect eta-expansion (unnecessary function wrappers)
 * Flags: (x) => fn(x), (a, b) => fn(a, b), etc.
 * These can be simplified to just: fn
 *
 * This is also known as "eta reduction" in functional programming.
 * The term comes from lambda calculus: λx.f(x) can be reduced to just f
 * when x doesn't appear elsewhere in the expression.
 */
export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Detect unnecessary function wrappers (eta-expansion). A function that only passes its parameters directly to another function can be replaced with that function. Example: (x) => fn(x) should be just fn.",
    },
    messages: {
      etaExpansion:
        "Unnecessary function wrapper (eta-expansion). This function only passes parameters directly to {{callee}}. Replace with {{callee}} directly for point-free style.",
    },
    schema: [],
  },

  createOnce(context) {
    // Route factory functions whose config callbacks are exempt from eta-expansion.
    // These callbacks often need wrappers because the caller passes arguments
    // with different types than what the inner function accepts.
    const ROUTE_FACTORIES = new Set([
      "createFileRoute",
      "createRootRoute",
      "createRoute",
      "createRootRouteWithContext",
    ]);

    // Arrow functions inside route config objects that should be exempt.
    // Populated by CallExpression visitor before ArrowFunctionExpression fires
    // (parent nodes are entered before children in depth-first traversal).
    const exemptArrows = new Set();

    const checkParametersMatch = (params, args) => {
      if (params.length !== args.length) return false;

      for (let i = 0; i < params.length; i++) {
        const param = params[i];
        const arg = args[i];

        // Parameter must be identifier
        if (param.type !== "Identifier") return false;

        // Argument must be identifier with same name
        if (arg.type !== "Identifier" || arg.name !== param.name) return false;
      }

      return true;
    };

    const getCalleeName = (callee) => {
      if (callee.type === "Identifier") {
        return callee.name;
      }
      if (callee.type === "MemberExpression") {
        const object =
          callee.object.type === "Identifier" ? callee.object.name : "...";
        const property =
          callee.property.type === "Identifier" ? callee.property.name : "...";
        return `${object}.${property}`;
      }
      return "the function";
    };

    return {
      // Collect arrow functions inside route config objects (e.g. createFileRoute(...)({...}))
      // so we can exempt them from the eta-expansion check below.
      CallExpression(node) {
        if (
          node.callee?.type === "CallExpression" &&
          node.callee.callee?.type === "Identifier" &&
          ROUTE_FACTORIES.has(node.callee.callee.name) &&
          node.arguments?.length > 0 &&
          node.arguments[0].type === "ObjectExpression"
        ) {
          for (const prop of node.arguments[0].properties) {
            if (
              prop.type === "Property" &&
              prop.value?.type === "ArrowFunctionExpression"
            ) {
              exemptArrows.add(prop.value);
            }
          }
        }
      },

      // Arrow functions: (x) => fn(x)
      ArrowFunctionExpression(node) {
        if (exemptArrows.has(node)) return;

        // Body must be a call expression
        if (node.body.type !== "CallExpression") return;

        const callExpr = node.body;

        // Check if parameters match arguments exactly
        if (checkParametersMatch(node.params, callExpr.arguments)) {
          const calleeName = getCalleeName(callExpr.callee);

          context.report({
            node,
            messageId: "etaExpansion",
            data: {
              callee: calleeName,
            },
          });
        }
      },

      // Function declarations: function foo(x) { return fn(x); }
      FunctionDeclaration(node) {
        // Must have a block body with single return statement
        if (
          !node.body ||
          node.body.type !== "BlockStatement" ||
          node.body.body.length !== 1 ||
          node.body.body[0].type !== "ReturnStatement"
        ) {
          return;
        }

        const returnStmt = node.body.body[0];

        // Return value must be a call expression
        if (
          !returnStmt.argument ||
          returnStmt.argument.type !== "CallExpression"
        )
          return;

        const callExpr = returnStmt.argument;

        // Check if parameters match arguments exactly
        if (checkParametersMatch(node.params, callExpr.arguments)) {
          const calleeName = getCalleeName(callExpr.callee);

          context.report({
            node,
            messageId: "etaExpansion",
            data: {
              callee: calleeName,
            },
          });
        }
      },

      // Function expressions: const foo = function(x) { return fn(x); }
      "VariableDeclarator > FunctionExpression"(node) {
        // Must have a block body with single return statement
        if (
          !node.body ||
          node.body.type !== "BlockStatement" ||
          node.body.body.length !== 1 ||
          node.body.body[0].type !== "ReturnStatement"
        ) {
          return;
        }

        const returnStmt = node.body.body[0];

        // Return value must be a call expression
        if (
          !returnStmt.argument ||
          returnStmt.argument.type !== "CallExpression"
        )
          return;

        const callExpr = returnStmt.argument;

        // Check if parameters match arguments exactly
        if (checkParametersMatch(node.params, callExpr.arguments)) {
          const calleeName = getCalleeName(callExpr.callee);

          context.report({
            node,
            messageId: "etaExpansion",
            data: {
              callee: calleeName,
            },
          });
        }
      },
    };
  },
});
