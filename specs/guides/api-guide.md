# API Guide

API conventions for `apps/api` and typed clients in `apps/web` and `apps/admin`.

## Architecture

```
web/admin client -> HttpApi client -> apps/api -> repository services
```

## Contract package

- Contracts live in `packages/api-contract`.
- Keep explicit export maps in `package.json`.
- Do not introduce a barrel `src/index.ts`.

## API server pattern

- Compose routes with `HttpLayerRouter.addHttpApi(AppApi)`.
- Add app-level middleware (CORS, health route) in `apps/api/src/main.ts`.
- Provide repository and migration layers explicitly.

## Client pattern

- Build typed clients with `HttpApiClient.make(AppApi)`.
- Apply transport behavior in `transformClient` (retry, status filtering).

## Error behavior

- Return typed domain errors from handlers.
- Avoid broad error mapping unless required by business logic.
