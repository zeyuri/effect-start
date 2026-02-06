# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (all apps concurrently)
bun turbo dev

# Single app dev
bun turbo dev --filter=@starter/api    # port 3000
bun turbo dev --filter=@starter/web    # port 3001
bun turbo dev --filter=@starter/admin  # port 3002

# Build
bun turbo build

# Quality checks
bun turbo lint          # oxlint with type-aware rules
bun turbo check-types   # tsc --noEmit per app
bun turbo format        # oxfmt write
bun turbo format:check  # oxfmt check only

# After cloning (patches TypeScript for Effect language service)
bun install && bun run prepare

# Database
bun run db:up           # start PostgreSQL via docker-compose
bun run db:migrate      # run SQL migrations
bun run db:seed         # insert sample data
bun run db:setup        # all three in sequence

# Tests
bun turbo test          # unit + integration tests (needs Docker for persistence)
```

Lint/format run per-app against `src/` using the root `.oxlintrc.json` and `.oxfmtrc.json` configs. Linting uses `--type-aware` flag.

## Architecture

Bun monorepo with Turborepo orchestration. Scope: `@starter/*`.

**apps/api** - Effect HTTP backend on Bun runtime. Uses `@effect/platform` HttpApi with `HttpApiBuilder.group` handlers. Entry point: `src/main.ts`. Port 3000.

**apps/web** - TanStack Start SSR app with Nitro server. File-based routing via TanStack Router in `src/routes/`. Entry point: `src/router.tsx`. Path alias `~/*` maps to `src/*`. Styled with Tailwind CSS v4. Uses `@effect-atom/atom-react` for reactive state. Port 3001.

**apps/admin** - React SPA with TanStack Router (file-based). Entry point: `src/main.tsx` with `ReactDOM.createRoot()`. Standard Vite build, no SSR. Port 3002.

**packages/core** - Domain schemas: `Todo`, `TodoId`, `CreateTodoInput`, `UpdateTodoInput`.

**packages/api-contract** - HTTP API contract: `TodosApiGroup`, `AppApi`, `TodoNotFound` error.

**packages/persistence** - PostgreSQL persistence: `TodoRepository` service, `TodoRepositoryLive` layer, migrations, seeds, CLI tools. Uses `@effect/sql-pg` with `SqlSchema`.

**packages/effect-lint** - Custom oxlint rules for Effect patterns.

**packages/vitest-config** - Shared Vitest configuration.

**packages/ui** - Shared React UI components.

## Critical: Web App Vite Plugin Order

The plugin order in `apps/web/vite.config.ts` **must** be exactly:
1. `tailwindcss()` 2. `tsConfigPaths()` 3. `nitro()` 4. `tanstackStart()` 5. `viteReact()`

Changing this order causes build failures.

## Strict Rules

- **Never use `as` type casts** -- all type assertions (`as X`, `as any`, `as unknown as X`) are prohibited. Use `Schema.make()` for branded types, `Schema.decodeUnknown` for parsing.

## Code Conventions

- **Formatting:** Double quotes, semicolons, 2-space indent, 80 char width, ES5 trailing commas (oxfmt)
- **Linting errors (must fix):** `no-floating-promises`, `await-thenable`, `no-for-in-array`, `no-explicit-any`, `no-console`
- **Linting warnings:** `no-unused-vars`, `no-debugger`, `require-array-sort-compare`
- **TypeScript:** Strict mode with `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, and `noUnusedLocals`
- **Routes:** File-based routing in both web and admin. Route files export a `Route` constant via `createFileRoute()`. Root layouts use `__root.tsx` with `createRootRoute()`. The `routeTree.gen.ts` files are auto-generated -- do not edit them
- **Effect patterns:** Use Layer composition for dependency injection, `Effect.gen` for effectful code, standalone `pipe()` function (not method `.pipe()`)

## Effect Best Practices

**Schema Patterns:**
- `Schema.Class` over `Schema.Struct` (gives constructor, Equal, Hash)
- `Schema.make()` constructor -- never use `new`
- `Schema.TaggedError` for all domain errors with `HttpApiSchema.annotations`
- Branded types for IDs (`TodoId`)
- No `*FromSelf` schemas -- use standard variants
- No `{ disableValidation: true }`

**Layer Patterns:**
- `Layer.effect` / `Layer.scoped` over `Layer.succeed` and `Tag.of`
- No nested `Layer.provide()` -- extract to variables or use `Layer.provideMerge`
- No `Effect.serviceOption` -- services must always be present

**Error Handling:**
- No `Effect.catchAllCause` (catches defects that should crash)
- No `() => Effect.void` in catch handlers (silent error swallowing)
- No `Effect.ignore` (silently discards errors)

**Import / Module Organization:**
- No barrel files -- import from specific modules
- No Sync variants (`decodeUnknown` not `decodeUnknownSync`)

**Code Quality:**
- No `console.*` in source files
- Write tests alongside implementation using `@effect/vitest`
- Use `expect` from `@effect/vitest`, not `it.expect`
- Use `Effect.gen` in test callbacks, not `it.effect.gen`
