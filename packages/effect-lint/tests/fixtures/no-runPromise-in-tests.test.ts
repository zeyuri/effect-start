import { Effect } from 'effect';

// eslint-disable-next-line effect/no-runPromise-in-tests
Effect.runPromise(Effect.succeed(42));
