# Error Design

This document defines error handling conventions for `effect-start`.

## Goal

Use typed domain errors from repository to API handler, and let HTTP annotations
drive the final status code.

## Principles

1. One error layer: domain errors only.
2. No silent failures: never swallow errors.
3. No generic `Error` in Effect error channels.
4. Map errors only when a business rule requires it.

## Canonical error shape

Use `Schema.TaggedError` with `HttpApiSchema.annotations`.

```ts
import * as HttpApiSchema from "@effect/platform/HttpApiSchema";
import * as Schema from "effect/Schema";

export class TodoNotFoundError extends Schema.TaggedError<TodoNotFoundError>()(
  "TodoNotFoundError",
  { id: Schema.String },
  HttpApiSchema.annotations({ status: 404 })
) {}
```

## Naming

Use `{Domain}{Failure}Error`, for example:

- `TodoNotFoundError`
- `PersistenceError`
- `ValidationError`

## Anti-patterns

- `Effect.catchAllCause` for expected domain failures.
- `Effect.ignore` and `() => Effect.void` catch handlers.
- Mapping all errors to one generic type without business reason.
