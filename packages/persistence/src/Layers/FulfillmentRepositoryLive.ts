import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as SqlSchema from "effect/unstable/sql/SqlSchema";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { OrderId } from "@starter/core/order/OrderId";
import { FulfillmentRow } from "../Schema/FulfillmentRow.ts";
import {
  FulfillmentRepository,
  type FulfillmentRepositoryService,
  type Fulfillment,
  type FulfillmentType,
  type FulfillmentStatus,
} from "../Services/FulfillmentRepository.ts";
import { wrapSqlError } from "../Errors/RepositoryError.ts";

const CreateRequest = Schema.Struct({
  order_id: Schema.String,
  type: Schema.String,
  status: Schema.String,
  provider: Schema.NullOr(Schema.String),
  metadata: Schema.Record(Schema.String, Schema.Unknown),
});

const FindByIdRequest = Schema.Struct({
  id: Schema.String,
});

const FindByOrderIdRequest = Schema.Struct({
  order_id: Schema.String,
});

const UpdateStatusRequest = Schema.Struct({
  id: Schema.String,
  status: Schema.String,
  metadata: Schema.Record(Schema.String, Schema.Unknown),
});

const JsonObject = Schema.Record(Schema.String, Schema.Unknown);

const isJsonObject = Schema.is(JsonObject);

const asMetadata = (value: unknown): Record<string, unknown> => {
  return isJsonObject(value) ? value : {};
};

const rowToDomain = (row: FulfillmentRow): Fulfillment => ({
  id: row.id,
  orderId: OrderId.makeUnsafe(row.order_id),
  type: row.type as FulfillmentType,
  status: row.status as FulfillmentStatus,
  provider: row.provider,
  trackingCode: row.tracking_code,
  shippedAt: row.shipped_at,
  deliveredAt: row.delivered_at,
  cancelledAt: row.cancelled_at,
  metadata: asMetadata(row.metadata),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const insertOne = SqlSchema.findOneOption({
    Request: CreateRequest,
    Result: FulfillmentRow,
    execute: ({ order_id, type, status, provider, metadata }) =>
      sql`
      INSERT INTO fulfillment (order_id, type, status, provider, metadata)
      VALUES (${order_id}, ${type}, ${status}, ${provider}, ${metadata}::jsonb)
      RETURNING *
    `,
  });

  const findById = SqlSchema.findOneOption({
    Request: FindByIdRequest,
    Result: FulfillmentRow,
    execute: ({ id }) => sql`
      SELECT * FROM fulfillment WHERE id = ${id}
    `,
  });

  const findByOrderId = SqlSchema.findAll({
    Request: FindByOrderIdRequest,
    Result: FulfillmentRow,
    execute: ({ order_id }) => sql`
      SELECT * FROM fulfillment
      WHERE order_id = ${order_id}
      ORDER BY created_at
    `,
  });

  const updateStatusQuery = SqlSchema.findOneOption({
    Request: UpdateStatusRequest,
    Result: FulfillmentRow,
    execute: ({ id, status, metadata }) => sql`
      UPDATE fulfillment
      SET status = ${status},
          metadata = ${metadata}::jsonb,
          updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `,
  });

  const create: FulfillmentRepositoryService["create"] = (input) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* insertOne({
        order_id: input.orderId,
        type: input.type,
        status: input.status ?? "pending",
        provider: input.provider ?? null,
        metadata: input.metadata ?? {},
      });
      return yield* Option.match(maybeRow, {
        onNone: () => Effect.die("INSERT RETURNING returned no rows"),
        onSome: (row) => Effect.succeed(rowToDomain(row)),
      });
    });
    return pipe(effect, wrapSqlError("FulfillmentRepository.create"));
  };

  const getById: FulfillmentRepositoryService["getById"] = (id) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* findById({ id });
      return Option.match(maybeRow, {
        onNone: () => null,
        onSome: rowToDomain,
      });
    });
    return pipe(effect, wrapSqlError("FulfillmentRepository.getById"));
  };

  const getByOrderId: FulfillmentRepositoryService["getByOrderId"] = (
    orderId
  ) => {
    const effect = Effect.gen(function* () {
      const rows = yield* findByOrderId({
        order_id: orderId,
      });
      return rows.map(rowToDomain);
    });
    return pipe(effect, wrapSqlError("FulfillmentRepository.getByOrderId"));
  };

  const updateStatus: FulfillmentRepositoryService["updateStatus"] = (
    id,
    status,
    metadata
  ) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* updateStatusQuery({
        id,
        status,
        metadata: metadata ?? {},
      });
      return yield* Option.match(maybeRow, {
        onNone: () => Effect.die("UPDATE RETURNING returned no rows"),
        onSome: (row) => Effect.succeed(rowToDomain(row)),
      });
    });
    return pipe(effect, wrapSqlError("FulfillmentRepository.updateStatus"));
  };

  return {
    create,
    getById,
    getByOrderId,
    updateStatus,
  } satisfies FulfillmentRepositoryService;
});

export const FulfillmentRepositoryLive = Layer.effect(FulfillmentRepository)(
  make
);
