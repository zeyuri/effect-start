import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as SqlSchema from "effect/unstable/sql/SqlSchema";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { WebhookEvent } from "@starter/core/payment/WebhookEvent";
import { WebhookEventId } from "@starter/core/payment/WebhookEventId";
import { WebhookEventRow } from "../Schema/WebhookEventRow.ts";
import {
  WebhookEventRepository,
  type WebhookEventRepositoryService,
} from "../Services/WebhookEventRepository.ts";
import {
  EntityNotFoundError,
  wrapSqlError,
  wrapSqlErrorKeepNotFound,
} from "../Errors/RepositoryError.ts";

const FindByIdRequest = Schema.Struct({ id: Schema.String });
const FindByStatusRequest = Schema.Struct({
  processing_status: Schema.String,
});
const InsertRequest = Schema.Struct({
  provider: Schema.String,
  event_id: Schema.String,
  event_type: Schema.String,
  payload: Schema.Record(Schema.String, Schema.Unknown),
});
const ClaimRequest = Schema.Struct({ id: Schema.String });
const MarkCompletedRequest = Schema.Struct({ id: Schema.String });
const MarkFailedRequest = Schema.Struct({
  id: Schema.String,
  error_message: Schema.String,
});
const FindByProviderEventIdRequest = Schema.Struct({
  provider: Schema.String,
  event_id: Schema.String,
});

const JsonObject = Schema.Record(Schema.String, Schema.Unknown);

const isJsonObject = Schema.is(JsonObject);

const asRecord = (value: unknown): Record<string, unknown> =>
  isJsonObject(value) ? value : {};

const webhookRowToDomain = (row: WebhookEventRow): WebhookEvent =>
  new WebhookEvent({
    id: WebhookEventId.makeUnsafe(row.id),
    provider: row.provider === "woovi" ? "woovi" : "stripe",
    eventId: row.event_id,
    eventType: row.event_type,
    payload: asRecord(row.payload),
    processingStatus:
      row.processing_status === "processing"
        ? "processing"
        : row.processing_status === "completed"
          ? "completed"
          : row.processing_status === "failed"
            ? "failed"
            : "pending",
    errorMessage: row.error_message,
    attempts: row.attempts,
    createdAt: row.created_at,
    processedAt: row.processed_at,
  });

/** Schema for INSERT ... ON CONFLICT result — returns id or null */
const InsertResult = Schema.Struct({ id: Schema.NullOr(Schema.String) });

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const findById = SqlSchema.findOneOption({
    Request: FindByIdRequest,
    Result: WebhookEventRow,
    execute: ({ id }) => sql`
      SELECT * FROM webhook_event WHERE id = ${id}
    `,
  });

  const findByStatus = SqlSchema.findAll({
    Request: FindByStatusRequest,
    Result: WebhookEventRow,
    execute: ({ processing_status }) => sql`
      SELECT * FROM webhook_event
      WHERE processing_status = ${processing_status}
      ORDER BY created_at ASC
    `,
  });

  /**
   * INSERT with ON CONFLICT dedup: returns the row if inserted,
   * or null if the event already exists (duplicate).
   */
  const insertIfNotExistsQuery = SqlSchema.findOneOption({
    Request: InsertRequest,
    Result: WebhookEventRow,
    execute: ({ provider, event_id, event_type, payload }) => sql`
      INSERT INTO webhook_event (provider, event_id, event_type, payload)
      VALUES (${provider}, ${event_id}, ${event_type}, ${payload}::jsonb)
      ON CONFLICT (provider, event_id) DO NOTHING
      RETURNING *
    `,
  });

  /**
   * Atomic claim: sets processing_status to 'processing' and increments
   * attempts only if current status is 'pending' or 'failed' (retryable).
   * Returns true if claimed, false if already processing/completed.
   */
  const claimQuery = SqlSchema.findOneOption({
    Request: ClaimRequest,
    Result: InsertResult,
    execute: ({ id }) => sql`
      UPDATE webhook_event
      SET processing_status = 'processing',
          attempts = attempts + 1
      WHERE id = ${id}
        AND processing_status IN ('pending', 'failed')
      RETURNING id
    `,
  });

  const markCompletedQuery = SqlSchema.findOneOption({
    Request: MarkCompletedRequest,
    Result: WebhookEventRow,
    execute: ({ id }) => sql`
      UPDATE webhook_event
      SET processing_status = 'completed',
          processed_at = now()
      WHERE id = ${id}
      RETURNING *
    `,
  });

  const markFailedQuery = SqlSchema.findOneOption({
    Request: MarkFailedRequest,
    Result: WebhookEventRow,
    execute: ({ id, error_message }) => sql`
      UPDATE webhook_event
      SET processing_status = 'failed',
          error_message = ${error_message}
      WHERE id = ${id}
      RETURNING *
    `,
  });

  const insertIfNotExists: WebhookEventRepositoryService["insertIfNotExists"] =
    (input) => {
      const effect = Effect.gen(function* () {
        const maybeRow = yield* insertIfNotExistsQuery({
          provider: input.provider,
          event_id: input.eventId,
          event_type: input.eventType,
          payload: input.payload,
        });
        return Option.match(maybeRow, {
          onNone: () => null,
          onSome: webhookRowToDomain,
        });
      });
      return pipe(
        effect,
        wrapSqlError("WebhookEventRepository.insertIfNotExists")
      );
    };

  const getById: WebhookEventRepositoryService["getById"] = (id) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* findById({ id });
      const row = yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "WebhookEvent",
              entityId: id,
            })
          ),
        onSome: Effect.succeed,
      });
      return webhookRowToDomain(row);
    });
    return pipe(
      effect,
      wrapSqlErrorKeepNotFound("WebhookEventRepository.getById")
    );
  };

  const claimForProcessing: WebhookEventRepositoryService["claimForProcessing"] =
    (id) => {
      const effect = Effect.gen(function* () {
        const maybeRow = yield* claimQuery({ id });
        return Option.isSome(maybeRow);
      });
      return pipe(
        effect,
        wrapSqlError("WebhookEventRepository.claimForProcessing")
      );
    };

  const markCompleted: WebhookEventRepositoryService["markCompleted"] = (
    id
  ) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* markCompletedQuery({ id });
      return yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "WebhookEvent",
              entityId: id,
            })
          ),
        onSome: (row) => Effect.succeed(webhookRowToDomain(row)),
      });
    });
    return pipe(
      effect,
      wrapSqlErrorKeepNotFound("WebhookEventRepository.markCompleted")
    );
  };

  const markFailed: WebhookEventRepositoryService["markFailed"] = (
    id,
    errorMessage
  ) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* markFailedQuery({
        id,
        error_message: errorMessage,
      });
      return yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "WebhookEvent",
              entityId: id,
            })
          ),
        onSome: (row) => Effect.succeed(webhookRowToDomain(row)),
      });
    });
    return pipe(
      effect,
      wrapSqlErrorKeepNotFound("WebhookEventRepository.markFailed")
    );
  };

  const listByStatus: WebhookEventRepositoryService["listByStatus"] = (
    status
  ) => {
    const effect = Effect.gen(function* () {
      const rows = yield* findByStatus({ processing_status: status });
      return rows.map(webhookRowToDomain);
    });
    return pipe(effect, wrapSqlError("WebhookEventRepository.listByStatus"));
  };

  const findByProviderEventId = SqlSchema.findOneOption({
    Request: FindByProviderEventIdRequest,
    Result: WebhookEventRow,
    execute: ({ provider, event_id }) => sql`
      SELECT * FROM webhook_event
      WHERE provider = ${provider} AND event_id = ${event_id}
    `,
  });

  const getByProviderAndEventId: WebhookEventRepositoryService["getByProviderAndEventId"] =
    (provider, eventId) => {
      const effect = Effect.gen(function* () {
        const maybeRow = yield* findByProviderEventId({
          provider,
          event_id: eventId,
        });
        return Option.match(maybeRow, {
          onNone: () => null,
          onSome: webhookRowToDomain,
        });
      });
      return pipe(
        effect,
        wrapSqlError("WebhookEventRepository.getByProviderAndEventId")
      );
    };

  const findAllDescRequest = Schema.Struct({});
  const findAllDesc = SqlSchema.findAll({
    Request: findAllDescRequest,
    Result: WebhookEventRow,
    execute: () => sql`
      SELECT * FROM webhook_event ORDER BY created_at DESC
    `,
  });

  const findByStatusDesc = SqlSchema.findAll({
    Request: FindByStatusRequest,
    Result: WebhookEventRow,
    execute: ({ processing_status }) => sql`
      SELECT * FROM webhook_event
      WHERE processing_status = ${processing_status}
      ORDER BY created_at DESC
    `,
  });

  const listAll: WebhookEventRepositoryService["listAll"] = (statusFilter) => {
    const effect = Effect.gen(function* () {
      if (statusFilter !== undefined) {
        const rows = yield* findByStatusDesc({
          processing_status: statusFilter,
        });
        return rows.map(webhookRowToDomain);
      }
      const rows = yield* findAllDesc({});
      return rows.map(webhookRowToDomain);
    });
    return pipe(effect, wrapSqlError("WebhookEventRepository.listAll"));
  };

  return {
    insertIfNotExists,
    getById,
    claimForProcessing,
    markCompleted,
    markFailed,
    listByStatus,
    getByProviderAndEventId,
    listAll,
  } satisfies WebhookEventRepositoryService;
});

export const WebhookEventRepositoryLive = Layer.effect(
  WebhookEventRepository,
)(make);
