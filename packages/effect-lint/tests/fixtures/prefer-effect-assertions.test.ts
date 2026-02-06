import { Effect } from 'effect';

// eslint-disable-next-line effect/prefer-effect-assertions
Effect.sync(() => expect(42).toBe(42));

// eslint-disable-next-line effect/prefer-effect-assertions
Effect.sync(() => {
  expect(1).toBe(1);
});

// eslint-disable-next-line effect/prefer-effect-assertions
Effect.sync(() => assertEquals(1, 1));
