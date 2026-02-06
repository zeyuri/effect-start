import * as HttpApiSchema from "@effect/platform/HttpApiSchema";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";

export class EntityNotFoundError extends Schema.TaggedError<EntityNotFoundError>()(
  "EntityNotFoundError",
  {
    entityType: Schema.String,
    entityId: Schema.String,
  },
  HttpApiSchema.annotations({ status: 404 })
) {}

export class PersistenceError extends Schema.TaggedError<PersistenceError>()(
  "PersistenceError",
  {
    operation: Schema.String,
    cause: Schema.Unknown,
  },
  HttpApiSchema.annotations({ status: 500 })
) {}

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
