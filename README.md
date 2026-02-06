# Effect Start

A monorepo starter kit built with Effect, TanStack, and Bun. Provides production-ready infrastructure with a simple Todo CRUD app as the example domain.

## Stack

- **Runtime:** Bun
- **Orchestration:** Turborepo
- **Backend:** Effect HTTP API (`@effect/platform`)
- **Web:** TanStack Start (SSR) + Tailwind CSS v4 + `@effect-atom`
- **Admin:** TanStack Router (SPA)
- **Database:** PostgreSQL + `@effect/sql-pg`
- **Linting:** oxlint with custom Effect rules
- **Formatting:** oxfmt
- **Testing:** Vitest + `@effect/vitest` + testcontainers

## Prerequisites

- [Bun](https://bun.sh/) >= 1.3
- [Docker](https://www.docker.com/) (for PostgreSQL)
- Node.js >= 22 (for some tooling)

## Getting Started

```bash
# Install dependencies
bun install

# Patch TypeScript for Effect language service
bun run prepare

# Start PostgreSQL
bun run db:up

# Run migrations and seed data
bun run db:migrate
bun run db:seed

# Start all apps in dev mode
bun turbo dev
```

Apps will be available at:
- API: http://localhost:3000
- Web: http://localhost:3001
- Admin: http://localhost:3002

## Project Structure

```
effect-start/
  apps/
    api/          # Effect HTTP API server (Bun runtime)
    web/          # TanStack Start SSR app
    admin/        # TanStack Router SPA
  packages/
    core/         # Domain schemas (Todo, TodoId, inputs)
    api-contract/ # HTTP API contract (endpoints, errors)
    persistence/  # PostgreSQL repositories + migrations
    effect-lint/  # Custom oxlint rules for Effect
    vitest-config/# Shared Vitest configuration
    ui/           # Shared React components
```

## Scripts

```bash
# Development
bun turbo dev                          # all apps
bun turbo dev --filter=@starter/api    # single app

# Quality
bun turbo check-types    # TypeScript type checking
bun turbo lint           # oxlint with type-aware rules
bun turbo format         # auto-format with oxfmt
bun turbo format:check   # check formatting only

# Testing
bun turbo test           # run all tests (needs Docker)

# Database
bun run db:up            # start PostgreSQL container
bun run db:migrate       # run SQL migrations
bun run db:seed          # insert sample data
bun run db:setup         # all three in sequence
bun run db:down          # stop PostgreSQL container
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/todos | List all todos |
| GET | /api/todos/:id | Get todo by ID |
| POST | /api/todos | Create a todo |
| PATCH | /api/todos/:id | Update a todo |
| DELETE | /api/todos/:id | Delete a todo |
| GET | /health | Health check |

## Architecture and Guides

- Specs index: `specs/README.md`
- Effect rules: `specs/guides/effect-guide.md`
- API patterns: `specs/guides/api-guide.md`
- Persistence patterns: `specs/guides/persistence-guide.md`
- Frontend patterns: `specs/guides/frontend-guide.md`
