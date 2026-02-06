# Persistence Guide

Persistence conventions for `packages/persistence`.

## Layout

- `src/Services/` - interfaces and `Context.Tag` declarations
- `src/Layers/` - live implementations and composition
- `src/Schema/` - SQL row schemas
- `src/Errors/` - typed repository errors
- `src/Migrations/` - static migration registry
- `src/cli/` - migrate/seed entry points
- `test/` - repository integration tests

## Rules

1. Interface-first repositories in `Services/`.
2. Live implementations in `Layers/` using Effect.
3. Use `SqlSchema` to decode rows; no `sql<...>` row generics.
4. No `try/catch` around normal query flow.
5. No barrel exports; keep package exports explicit in `package.json`.

## Error conventions

- Use `Schema.TaggedError` for `EntityNotFoundError` and `PersistenceError`.
- Add `HttpApiSchema.annotations` for status mapping.
- Wrap infra failures with `wrapSqlError` helpers.

## Testing

- Integration tests should exercise repository behavior with a real PG client.
- Cover: create/list/get/update/remove and not-found paths.
