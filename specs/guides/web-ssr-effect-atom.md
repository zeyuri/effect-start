# Web SSR + Effect Atom

Pattern for SSR data loading in `apps/web` with Effect Atom.

## Target flow

1. Define remote atoms in `routes/*/-lib/atoms.ts`.
2. Serialize atom state with `serializable({ key, schema: Result.Schema(...) })`.
3. In a route loader/server function, execute effects with a server runtime.
4. Return dehydrated atom state from the loader.
5. Hydrate in the route component using `HydrationBoundary`.

## Conventions

- Validate route params with Schema decoders.
- Use stable atom keys.
- Return dehydrated state, not ad-hoc plain objects.
- Preserve failure states through `Result` values.

## Avoid

- Loading initial route data only from `useEffect`.
- Mixing untyped fetch calls with typed HttpApi clients.
