# atom-utils Type Safety

File: `apps/web/src/lib/atom-utils.ts`

This document records type-level constraints used for SSR atom dehydration.

## What this utility does

- Exposes `serializable` from Effect Atom.
- Defines a narrowed dehydrated payload shape.
- Provides `dehydrate(...)` for serializable values.

## Safety rules

1. `dehydrate` uses `I extends {}` to guarantee non-nullish payload values.
2. Avoid output casts such as `as {}` or `as any` in dehydration logic.
3. Keep serialized values aligned with `Result.Schema` encoded types.

## Why `I extends {}` exists

TanStack Start route loaders expect serializable object-like payloads. The
constraint prevents null/undefined encoded outputs from being passed as
hydration values.

## Maintenance checklist

- If `atom-utils.ts` changes, verify web route loaders still type-check.
- Keep this document in sync with the actual helper signatures.
