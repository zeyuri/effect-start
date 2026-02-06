# Effect Guide

This guide captures Effect usage rules for `apps/api` and shared packages.

## Critical rules

1. No `any` and no type casts (`as X`).
2. No barrel imports from `effect` (use `effect/Effect`, `effect/Layer`, etc).
3. No barrel files in app packages (`index.ts` re-export hubs are banned).
4. No `Effect.catchAllCause` for domain flow.
5. No `Effect.ignore` and no silent catch handlers.
6. No `Effect.serviceOption`.
7. Prefer `Layer.effect` / `Layer.scoped` over `Layer.succeed`.
8. No nested `Layer.provide(...)` chains when `Layer.provideMerge` is clearer.

## Schema patterns

- Use `Schema.Class` for domain entities.
- Use branded string IDs (example: `TodoId`).
- Use `Schema.TaggedError` for domain and persistence errors.
- Use `Schema.decodeUnknown` (not sync decode variants).

## Error handling

- Expected failures stay in the typed error channel.
- Defects should crash and be fixed; do not hide them.
- Use `Effect.catchTag` to recover specific failures.

## Import style

Preferred:

```ts
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { pipe } from "effect/Function";
```

Avoid:

```ts
import { Effect, Layer, pipe } from "effect";
```
