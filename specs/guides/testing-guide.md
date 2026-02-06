# Testing Guide

Testing and verification checklist for `effect-start`.

## Quality checks

Run before finishing work:

```bash
bun turbo lint
bun turbo check-types
bun turbo format:check
```

## Test types

- Unit tests: core schema/domain behavior
- Integration tests: API handlers and repository boundaries
- E2E tests: key web/admin user flows

## Naming and placement

- API integration: `apps/api/test/**/*.integration.test.ts`
- Package tests: `packages/*/test/**/*.test.ts`
- E2E tests: `apps/*/tests/**/*.spec.ts`

## Error-focused tests

When adding or changing errors, verify:

- Error class is a `Schema.TaggedError`
- Error includes `HttpApiSchema.annotations`
- API behavior matches expected status and error tag
