import * as Data from "effect/Data";
import * as Effect from "effect/Effect";

export class EntityNotFoundError extends Data.TaggedError(
  "EntityNotFoundError"
)<{
  readonly entityType: string;
  readonly entityId: string;
}> {}

export class PersistenceError extends Data.TaggedError("PersistenceError")<{
  readonly operation: string;
  readonly cause: unknown;
}> {}

export class InsufficientStockError extends Data.TaggedError(
  "InsufficientStockError"
)<{
  readonly productVariantId: string;
  readonly requested: number;
  readonly available: number;
}> {}

export const wrapSqlError =
  (operation: string) =>
  <A, E, R>(
    effect: Effect.Effect<A, E, R>
  ): Effect.Effect<A, PersistenceError, R> =>
    Effect.mapError(
      effect,
      (cause) => new PersistenceError({ operation, cause })
    );

export const wrapSqlErrorKeepNotFound =
  (operation: string) =>
  <A, E, R>(
    effect: Effect.Effect<A, E, R>
  ): Effect.Effect<A, PersistenceError | EntityNotFoundError, R> =>
    Effect.mapError(effect, (cause): PersistenceError | EntityNotFoundError =>
      cause instanceof EntityNotFoundError
        ? cause
        : new PersistenceError({ operation, cause })
    );

export const wrapSqlErrorKeepStockError =
  (operation: string) =>
  <A, E, R>(
    effect: Effect.Effect<A, E, R>
  ): Effect.Effect<A, PersistenceError | InsufficientStockError, R> =>
    Effect.mapError(
      effect,
      (cause): PersistenceError | InsufficientStockError =>
        cause instanceof InsufficientStockError
          ? cause
          : new PersistenceError({ operation, cause })
    );
