# Frontend Guide

Frontend conventions for `apps/web` (SSR) and `apps/admin` (SPA).

## Routing

- Use file-based routes with TanStack Router.
- Root route files are `__root.tsx`.
- Never edit generated `routeTree.gen.ts` files.

## Web app (SSR)

- Use loader-first data fetching for initial route render.
- Hydrate Effect Atom state through `HydrationBoundary`.
- Follow `web-ssr-effect-atom.md` patterns.

## Admin app (SPA)

- Keep admin client-side only.
- Prefer AtomHttpApi query/mutation atoms for API integration.
- Follow `admin-atom-httpapi.md` patterns.

## Shared rules

- Keep API access typed through `AppApi` contracts.
- No `as any` or unsafe type assertions.
- Keep components small and composable.
