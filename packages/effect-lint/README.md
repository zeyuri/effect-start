# effect-lint

Oxlint JS plugin for Effect lint rules, implemented with Oxlint's alternative API for future performance gains.

This package ports the rules from [`@codeforbreakfast/eslint-effect`](https://github.com/CodeForBreakfast/eventsourcing/tree/main/packages/eslint-effect) and keeps the same rule names (prefix: `effect/`).

## Installation

```bash
npm install --save-dev @zeyuri/effect-lint oxlint
```

Or with Bun:

```bash
bun add -D @zeyuri/effect-lint oxlint
```

## Requirements

- `oxlint` >= 1.42.0
- JS plugins are experimental in Oxlint and may emit a warning on run

## Usage

`.oxlintrc.json`

```json
{
  "jsPlugins": ["@zeyuri/effect-lint"],
  "rules": {
    "effect/no-classes": "error",
    "effect/no-runSync": "error",
    "effect/no-runPromise": "error"
  }
}
```

## Config Bundles

Prebuilt configs are available in `configs/`:

- `configs/recommended.json` - Core Effect best practices + basic pipe rules
- `configs/strict.json` - All rules including opinionated ones
- `configs/no-gen.json` - Forbid `Effect.gen`
- `configs/prefer-match.json` - Forbid direct `_tag` access, `switch`, and `if` statements
- `configs/pipe-strict.json` - Strict pipe composition rules
- `configs/plugin.json` - Plugin rules only, no core Effect restrictions
- `configs/testing.json` - Test-specific rules for `@effect/vitest`

Example:

```bash
oxlint --config node_modules/@zeyuri/effect-lint/configs/recommended.json src
```

## Rules

### Functional Programming Restrictions

#### `effect/no-classes`

Forbid classes except Effect service tags, error classes, and Schema classes.

| | |
| --- | --- |
| Type | problem |
| Configs | `recommended`, `strict` |

Classes extending `Context.Tag`, `Context.GenericTag`, `Effect.Tag`, `Data.TaggedError`, or `Schema.Class` are allowed.

```typescript
// bad
class MyService {}

// good
class MyError extends Data.TaggedError<"MyError">() {}
class MyTag extends Context.Tag("MyTag")<MyTag, { value: number }>() {}
```

#### `effect/no-runSync`

Forbid `Effect.runSync` in production code. Effects should be composed and run at the application boundary.

| | |
| --- | --- |
| Type | problem |
| Configs | `recommended`, `strict` |

```typescript
// bad
const result = Effect.runSync(myEffect);

// good - compose effects, run at the boundary
pipe(myEffect, Effect.flatMap(nextStep));
```

#### `effect/no-runPromise`

Forbid `Effect.runPromise` in production code. Effects should be composed and run at the application boundary.

| | |
| --- | --- |
| Type | problem |
| Configs | `recommended`, `strict` |

```typescript
// bad
const promise = Effect.runPromise(myEffect);

// good - compose effects, run at the boundary
pipe(myEffect, Effect.flatMap(nextStep));
```

#### `effect/no-gen`

Forbid `Effect.gen` in favor of `pipe` composition.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `noGen`, `strict` |

```typescript
// bad
Effect.gen(function* () {
  const x = yield* effect1;
  const y = yield* effect2;
  return x + y;
});

// good
pipe(
  effect1,
  Effect.flatMap((x) => pipe(effect2, Effect.map((y) => x + y)))
);
```

### Pipe Composition Rules

#### `effect/no-method-pipe`

Forbid method-based `.pipe()` syntax. Use the standalone `pipe()` function instead.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `recommended`, `strict` |

```typescript
// bad
effect.pipe(fn1, fn2);

// good
pipe(effect, fn1, fn2);
```

#### `effect/no-curried-calls`

Forbid curried function calls like `foo(a)(b)`. Extract a named function instead.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `recommended`, `strict` |

Allowed: `Context.Tag(...)()`, `Effect.Tag(...)()`, `Data.TaggedError(...)()`, `Schema.Class(...)()`.

```typescript
// bad
pipe(data, myFunction(arg1)(arg2));

// good
const myFn = (a, b) => (c) => pipe(c, foo(a, b));
pipe(data, myFn(arg1, arg2));
```

#### `effect/no-identity-transform`

Forbid pointless identity functions in transformations.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `recommended`, `strict` |

```typescript
// bad
pipe(effect, Effect.map((x) => x));

// good - remove the no-op or replace with actual transformation
pipe(effect, Effect.map((x) => x + 1));
```

#### `effect/no-pipe-first-arg-call`

First argument in `pipe()` should not be a function call with a single argument. Use the value directly and add the function to the chain.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `recommended`, `strict` |

```typescript
// bad
pipe(fn(x), fn1, fn2);

// good
pipe(x, fn, fn1, fn2);
```

#### `effect/no-nested-pipe`

Forbid nested `pipe()` calls. Extract the inner pipe to a separate named function.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `pipeStrict`, `strict` |

```typescript
// bad
pipe(
  value,
  fn1,
  (x) => pipe(x, fn2, fn3)
);

// good
const innerFn = flow(fn2, fn3);
pipe(value, fn1, innerFn);
```

#### `effect/no-nested-pipes`

Forbid nested `pipe()` calls where one is an argument to another.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `pipeStrict`, `strict` |

```typescript
// bad
pipe(pipe(value, fn1), fn2);

// good
pipe(value, fn1, fn2);
```

#### `effect/no-unnecessary-pipe-wrapper`

Detect unnecessary function wrappers around single pipe operations.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `recommended`, `strict` |

```typescript
// bad
const fn = (x) => pipe(x, transform);

// good
const fn = transform;
```

#### `effect/no-intermediate-effect-variables`

Forbid storing pipe/Effect results in single-use intermediate variables. Inline them directly into the pipe chain.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `pipeStrict`, `strict` |

Variables reused multiple times and configuration data (Schedule constants, Layer compositions) are allowed.

```typescript
// bad
const userEffect = fetchUser(userId);
const result = pipe(userEffect, Effect.flatMap(validate), Effect.map(format));

// good
const result = pipe(fetchUser(userId), Effect.flatMap(validate), Effect.map(format));

// good - reused multiple times
const PgLive = Layer.effect(PgClientService, createPgClient);
const Layer1 = pipe(Migration.layer, Layer.provide(PgLive));
const Layer2 = pipe(EventStore.layer, Layer.provide(PgLive));
```

### Transformation Simplification Rules

#### `effect/prefer-andThen`

Prefer `.andThen(value)` over `.flatMap(() => value)` when discarding input.

| | |
| --- | --- |
| Type | suggestion |
| Fixable | Yes |
| Configs | `recommended`, `strict` |

Supports: Effect, Option, Stream, STM.

```typescript
// bad
pipe(effect, Effect.flatMap(() => Effect.succeed(42)));

// good
pipe(effect, Effect.andThen(Effect.succeed(42)));
```

#### `effect/prefer-as`

Prefer `.as(value)` over `.map(() => value)` for constant returns.

| | |
| --- | --- |
| Type | suggestion |
| Fixable | Yes |
| Configs | `recommended`, `strict` |

Supports: Effect, Option, Stream, Schedule, Channel, STM, Sink, Cause.

```typescript
// bad
pipe(effect, Effect.map(() => 42));

// good
pipe(effect, Effect.as(42));
```

#### `effect/prefer-as-void`

Prefer `.asVoid` over `.map(() => undefined)` or `.map(() => void 0)`.

| | |
| --- | --- |
| Type | suggestion |
| Fixable | Yes |
| Configs | `recommended`, `strict` |

Supports: Effect, Option, Stream.

```typescript
// bad
pipe(effect, Effect.map(() => undefined));

// good
pipe(effect, Effect.asVoid);
```

#### `effect/prefer-as-some`

Prefer `.asSome` over `.map(Option.some)`.

| | |
| --- | --- |
| Type | suggestion |
| Fixable | Yes |
| Configs | `recommended`, `strict` |

```typescript
// bad
pipe(effect, Effect.map(Option.some));

// good
pipe(effect, Effect.asSome);
```

#### `effect/prefer-as-some-error`

Prefer `.asSomeError` over `.mapError(Option.some)`.

| | |
| --- | --- |
| Type | suggestion |
| Fixable | Yes |
| Configs | `recommended`, `strict` |

```typescript
// bad
pipe(effect, Effect.mapError(Option.some));

// good
pipe(effect, Effect.asSomeError);
```

#### `effect/prefer-flatten`

Prefer `.flatten` over `.flatMap(identity)`.

| | |
| --- | --- |
| Type | suggestion |
| Fixable | Yes |
| Configs | `recommended`, `strict` |

Supports: Effect, Option, Array, Cause, STM.

```typescript
// bad
pipe(effect, Effect.flatMap(identity));

// good
pipe(effect, Effect.flatten);
```

#### `effect/prefer-zip-left`

Prefer `.zipLeft` over `.flatMap(a => .map(b, () => a))` for sequential execution keeping the first result.

| | |
| --- | --- |
| Type | suggestion |
| Fixable | Yes |
| Configs | `recommended`, `strict` |

```typescript
// bad
pipe(effect1, Effect.flatMap((a) => Effect.map(effect2, () => a)));

// good
pipe(effect1, Effect.zipLeft(effect2));
```

#### `effect/prefer-zip-right`

Prefer `.zipRight` over `.flatMap(() => b)` for sequential execution keeping the second result.

| | |
| --- | --- |
| Type | suggestion |
| Fixable | Yes |
| Configs | `recommended`, `strict` |

```typescript
// bad
pipe(effect1, Effect.flatMap(() => effect2));

// good
pipe(effect1, Effect.zipRight(effect2));
```

#### `effect/prefer-ignore`

Prefer `.ignore` over `.match` with void-returning handlers.

| | |
| --- | --- |
| Type | suggestion |
| Fixable | Yes |
| Configs | `recommended`, `strict` |

```typescript
// bad
pipe(effect, Effect.match({ onSuccess: constVoid, onFailure: constVoid }));

// good
pipe(effect, Effect.ignore);
```

#### `effect/prefer-ignore-logged`

Prefer `.ignoreLogged` over `.matchCauseEffect` with logging and void.

| | |
| --- | --- |
| Type | suggestion |
| Fixable | Yes |
| Configs | `recommended`, `strict` |

```typescript
// bad
pipe(
  effect,
  Effect.matchCauseEffect({ onFailure: (c) => logDebug(c), onSuccess: () => Effect.void })
);

// good
pipe(effect, Effect.ignoreLogged);
```

### Option / Result Handling Rules

#### `effect/prefer-from-nullable`

Prefer `Option.fromNullable(value)` over a ternary null check.

| | |
| --- | --- |
| Type | suggestion |
| Fixable | Yes |
| Configs | `recommended`, `strict` |

```typescript
// bad
value != null ? Option.some(value) : Option.none();

// good
Option.fromNullable(value);
```

#### `effect/prefer-get-or-else`

Prefer `Option.getOrElse(() => default)` over a ternary with `Option.isSome`.

| | |
| --- | --- |
| Type | suggestion |
| Fixable | Yes |
| Configs | `recommended`, `strict` |

```typescript
// bad
Option.isSome(opt) ? opt.value : defaultValue;

// good
pipe(opt, Option.getOrElse(() => defaultValue));
```

#### `effect/prefer-get-or-null`

Prefer `Option.getOrNull` over `Option.getOrElse(() => null)`.

| | |
| --- | --- |
| Type | suggestion |
| Fixable | Yes |
| Configs | `recommended`, `strict` |

```typescript
// bad
pipe(opt, Option.getOrElse(() => null));

// good
pipe(opt, Option.getOrNull);
```

#### `effect/prefer-get-or-undefined`

Prefer `Option.getOrUndefined` over `Option.getOrElse(() => undefined)`.

| | |
| --- | --- |
| Type | suggestion |
| Fixable | Yes |
| Configs | `recommended`, `strict` |

```typescript
// bad
pipe(opt, Option.getOrElse(() => undefined));

// good
pipe(opt, Option.getOrUndefined);
```

#### `effect/prefer-succeed-none`

Prefer `Effect.succeedNone` over `Effect.succeed(Option.none())`.

| | |
| --- | --- |
| Type | suggestion |
| Fixable | Yes |
| Configs | `recommended`, `strict` |

```typescript
// bad
Effect.succeed(Option.none());

// good
Effect.succeedNone;
```

### Pattern Matching & Conditionals

#### `effect/prefer-match-tag`

Enforce `Match.tag()` over `Match.when()` for `_tag` discriminators.

| | |
| --- | --- |
| Type | suggestion |
| Fixable | Yes |
| Configs | `recommended`, `strict` |

```typescript
// bad
pipe(Match.value(value), Match.when({ _tag: "Success" }, handler));

// good
pipe(Match.value(value), Match.tag("Success", handler));
```

#### `effect/prefer-match-over-conditionals`

Use `Match` instead of imperative `if` statements when checking discriminated unions in Effect callbacks.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `recommended`, `strict` |

Supported discriminator properties: `type`, `_tag`, `kind`, `variant`.

```typescript
// bad
pipe(
  effectValue,
  Effect.flatMap((x) => {
    if (x._tag === "Success") return handleSuccess(x);
    return handleError(x);
  })
);

// good
pipe(
  effectValue,
  Effect.flatMap((x) =>
    pipe(Match.value(x), Match.tag("Success", handleSuccess), Match.orElse(handleError))
  )
);
```

#### `effect/prefer-match-over-ternary`

Prefer `Match.value` over ternary operators for non-boolean conditional branching.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `recommended`, `strict` |

For boolean conditions returning Effects, use `Effect.if` instead.

```typescript
// bad
const result = filter !== undefined ? Stream.filter(stream, filter) : stream;

// good
const result = pipe(
  filter,
  Match.value,
  Match.when(Match.undefined, () => stream),
  Match.orElse((f) => Stream.filter(stream, f))
);
```

#### `effect/prefer-effect-if-over-match-boolean`

Prefer `Effect.if` over `Match.value` for boolean conditionals.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `recommended`, `strict` |

```typescript
// bad
pipe(
  isValid,
  Match.value,
  Match.when(true, () => Effect.succeed("valid")),
  Match.when(false, () => Effect.fail("invalid")),
  Match.exhaustive
);

// good
Effect.if(isValid, {
  onTrue: () => Effect.succeed("valid"),
  onFalse: () => Effect.fail("invalid"),
});
```

#### `effect/no-effect-if-option-check`

Forbid `Effect.if` with `Option.isSome`/`Option.isNone`. Use `Option.match` instead.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `recommended`, `strict` |

```typescript
// bad
Effect.if(Option.isSome(opt), { onTrue: () => effect1, onFalse: () => effect2 });

// good
pipe(
  opt,
  Option.match({ onSome: (value) => effect1, onNone: () => effect2 })
);
```

#### `effect/no-direct-tag-access`

Forbid direct `._tag` property access. Use type guards or `Match` instead.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `preferMatch`, `strict` |

Alternatives: `Either.isLeft`/`isRight`, `Option.isSome`/`isNone`, `Exit.isSuccess`/`isFailure`, or `match()` functions.

```typescript
// bad
if (value._tag === "Success") { /* ... */ }

// good
pipe(
  value,
  Option.match({ onSome: handleSome, onNone: handleNone })
);
```

#### `effect/no-switch-statement`

Forbid `switch` statements. Use `Match.value` for pattern matching.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `preferMatch`, `strict` |

```typescript
// bad
switch (event.type) {
  case "Created":
    return handleCreated(event);
  case "Updated":
    return handleUpdated(event);
  default:
    return handleUnknown(event);
}

// good
pipe(
  Match.value(event),
  Match.when({ type: "Created" }, handleCreated),
  Match.when({ type: "Updated" }, handleUpdated),
  Match.orElse(handleUnknown)
);
```

#### `effect/no-if-statement`

Forbid `if` statements in functional code. Use `Effect.if`, `Match.value`, or type-specific matchers.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `preferMatch`, `strict` |

Ternary operators are still allowed for simple value selection.

```typescript
// bad
if (todoState.deleted) {
  return Effect.fail(new Error("Cannot complete deleted TODO"));
}
return Effect.succeed(todoState);

// good
Effect.if(todoState.deleted, {
  onTrue: () => Effect.fail(new Error("Cannot complete deleted TODO")),
  onFalse: () => Effect.succeed(todoState),
});
```

### Code Quality & Optimization

#### `effect/no-eta-expansion`

Detect unnecessary function wrappers (eta-expansion). Prefer point-free style.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `recommended`, `strict` |

```typescript
// bad
const logError = (msg) => Console.error(msg);
const transform = (x) => doSomething(x);

// good
const logError = Console.error;
const transform = doSomething;
```

#### `effect/no-unnecessary-function-alias`

Detect unnecessary function aliases that provide no semantic value. When an alias is only used a few times, inline the original function at the call site.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `recommended`, `strict` |

Configuration: `maxReferences` (default: `2`) - maximum references before an alias is considered justified.

```typescript
// bad
const getState = Ref.get;
useOnce(getState(ref)); // used once

// good
useOnce(Ref.get(ref)); // inlined
```

#### `effect/suggest-currying-opportunity`

Suggest currying user-defined functions to eliminate arrow function wrappers in pipe chains.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `recommended`, `strict` |

Configuration:
- `allowReordering` (default: `false`) - allow parameter reordering suggestions
- `maxCurriedParams` (default: `1`, max: `3`) - maximum curried parameter depth

Only triggers on user-defined functions, not Effect library functions.

```typescript
// before
Effect.catchAll(myEffect, (error) => logError("Failed", error));

// after currying
const logErrorCurried = (message) => (error) => logError(message, error);
Effect.catchAll(myEffect, logErrorCurried("Failed"));
```

#### `effect/prefer-schema-validation-over-assertions`

Forbid type assertions (`as`) in Effect callbacks. Use `Schema.decodeUnknown` for runtime validation instead.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `recommended`, `strict` |

```typescript
// bad
Effect.map((x) => handler(x as MyType));

// good
pipe(input, Effect.flatMap(Schema.decodeUnknown(MyTypeSchema)), Effect.map(handler));
```

### Testing Rules

#### `effect/no-runPromise-in-tests`

Forbid `Effect.runPromise()` in test files. Use `it.effect()` from `@effect/vitest` instead.

| | |
| --- | --- |
| Type | problem |
| Configs | `testing` |

```typescript
// bad
it("does something", () => Effect.runPromise(myEffect));

// good
it.effect("does something", () => myEffect);
```

#### `effect/no-runSync-in-tests`

Forbid `Effect.runSync()` in test files. Use `it.effect()` from `@effect/vitest` instead.

| | |
| --- | --- |
| Type | problem |
| Configs | `testing` |

```typescript
// bad
it("does something", () => Effect.runSync(myEffect));

// good
it.effect("does something", () => myEffect);
```

#### `effect/prefer-effect-assertions`

Forbid wrapping `expect()` or `assert*()` calls in `Effect.sync()`. Use assertions from `@effect/vitest` instead.

| | |
| --- | --- |
| Type | suggestion |
| Configs | `testing` |

```typescript
// bad
Effect.sync(() => expect(value).toBe(42));
Effect.sync(() => assertEquals(a, b));

// good - use @effect/vitest assertions
assertEqual(value, 42);
expectSome(option);
expectTrue(condition);
```

### Platform API Rules

#### `effect/prefer-effect-platform`

Prefer `@effect/platform` APIs over native platform APIs.

| | |
| --- | --- |
| Type | problem |
| Configs | `recommended`, `strict` |

| Native API | Effect replacement |
| --- | --- |
| `fetch()` | `HttpClient` |
| `node:fs`, `Bun.file()`, `Deno.readFile()` | `FileSystem` |
| `node:path` | `Path` |
| `node:child_process`, `Bun.spawn()`, `Deno.Command()` | `Command` |
| `console.log()`, `process.stdout/stderr` | `Terminal` |
| `process.env`, `process.exit()` | `Runtime` |

## Rule Presets

### `recommended`

**Recommended for most projects.** Core Effect best practices without controversial rules. Includes all plugin rules + core Effect restrictions + basic pipe rules (38 rules).

### `strict`

**For zealots.** Everything in `recommended` plus all opinionated rules: forbids `Effect.gen`, direct `_tag` access, `switch`/`if` statements, nested pipes, and single-use intermediate variables (45 rules).

### `noGen`

Opt-in: forbids `Effect.gen` in favor of `pipe` composition.

### `preferMatch`

Opt-in: forbids direct `_tag` access, all `switch` statements, and all `if` statements.

### `pipeStrict`

Opt-in: forbids nested pipes and single-use intermediate Effect variables.

### `testing`

**For test files using `@effect/vitest`.** Forbids `Effect.runPromise()`/`Effect.runSync()` in tests (use `it.effect()` instead) and discourages wrapping assertions in `Effect.sync()` (3 rules).

```bash
oxlint --config node_modules/@zeyuri/effect-lint/configs/testing.json tests
```

### `plugin`

Plugin rules only, no core Effect restrictions (28 rules).

## Notes on the Alternative API

All rules use `defineRule` and the plugin is wrapped with `definePlugin`. This is the Oxlint alternative API, which is designed to enable future performance improvements without changes to the rules.

## Development

```bash
bun install
bun run test
```

## Publishing

```bash
npm login
npm publish --access public
```

## Credits

All rules are ported from [`@codeforbreakfast/eslint-effect`](https://github.com/CodeForBreakfast/eventsourcing/tree/main/packages/eslint-effect) by [CodeForBreakfast](https://github.com/CodeForBreakfast). This project re-implements them as an Oxlint JS plugin.

## License

MIT
