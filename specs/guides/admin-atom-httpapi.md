# Admin SPA + AtomHttpApi

Recommended API integration pattern for `apps/admin`.

## Why

AtomHttpApi gives typed query/mutation atoms built directly from `AppApi`.

## Pattern

1. Create an API tag using `AtomHttpApi.Tag`.
2. Use `query` atoms for list/read operations.
3. Use `mutation` atoms for write operations.
4. Render UI with `Result` helpers for loading/failure/success states.

## Conventions

- Keep base URL in `VITE_API_BASE_URL`.
- Keep atoms in route-local `-lib` files.
- Avoid ad-hoc `runPromise(...).then(...).catch(...)` in components.
