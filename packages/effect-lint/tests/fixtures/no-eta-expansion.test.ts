import { Effect, Console } from 'effect';

const transform = (x: number) => x * 2;
const doSomething = (a: string, b: number) => `${a}: ${b}`;

// Arrow function - single parameter
// eslint-disable-next-line effect/no-eta-expansion
const singleParamWrapper = (x: number) => transform(x);

// Arrow function - multiple parameters
// eslint-disable-next-line effect/no-eta-expansion
const multiParamWrapper = (a: string, b: number) => doSomething(a, b);

// Arrow function - method call
// eslint-disable-next-line effect/no-eta-expansion
const methodWrapper = (msg: string) => Console.log(msg);

// Arrow function - Effect method
// eslint-disable-next-line effect/no-eta-expansion
const effectWrapper = (value: number) => Effect.succeed(value);

// Function declaration - single parameter
// eslint-disable-next-line effect/no-eta-expansion
function functionDeclWrapper(x: number) {
  return transform(x);
}

// Function declaration - multiple parameters
// eslint-disable-next-line effect/no-eta-expansion
function functionDeclMultiParam(a: string, b: number) {
  return doSomething(a, b);
}

// Function expression - single parameter
// eslint-disable-next-line effect/no-eta-expansion
const functionExprWrapper = function (x: number) {
  return transform(x);
};

// Function expression - multiple parameters
// eslint-disable-next-line effect/no-eta-expansion
const functionExprMultiParam = function (a: string, b: number) {
  return doSomething(a, b);
};

// Valid cases that should NOT trigger the rule:

// Different parameter names
const validDifferentNames = (x: number) => transform(x + 1);

// Different parameter order
const validDifferentOrder = (a: string, b: number) => doSomething(b.toString(), Number(a));

// Additional operations
const validAdditionalOps = (x: number) => {
  const doubled = transform(x);
  return doubled;
};

// Different number of parameters
const validDifferentCount = (x: number) => doSomething('prefix', x);

// Not a call expression
const validNotACall = (x: number) => x;

// Curried function (intentional wrapper)
const validCurried = (prefix: string) => (x: number) => doSomething(prefix, x);

// --- Route config exemptions (must NOT trigger) ---

const listProducts = () => Effect.succeed([]);
const checkAuth = () => Effect.succeed(true);
const fetchData = () => Effect.succeed({});

// createFileRoute - single exempt arrow
const routeA = createFileRoute("/")({ loader: () => listProducts() });

// createFileRoute - multiple exempt arrows
const routeB = createFileRoute("/")({
  loader: () => listProducts(),
  beforeLoad: () => checkAuth(),
});

// createRootRoute exempt
const rootRoute = createRootRoute()({ beforeLoad: () => checkAuth() });

// createRoute exempt
const namedRoute = createRoute()({ loader: () => fetchData() });

// Non-route object — should STILL trigger
const notARoute = {
  // eslint-disable-next-line effect/no-eta-expansion
  loader: (x: number) => transform(x),
};
