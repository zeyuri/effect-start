import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as SqlSchema from "effect/unstable/sql/SqlSchema";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { Payment } from "@starter/core/payment/Payment";
import { PaymentId } from "@starter/core/payment/PaymentId";
import { OrderId } from "@starter/core/order/OrderId";
import { CurrencyCode } from "@starter/core/shared/values/CurrencyCode";
import { PaymentRow } from "../Schema/PaymentRow.ts";
import {
  PaymentRepository,
  type PaymentRepositoryService,
} from "../Services/PaymentRepository.ts";
import {
  EntityNotFoundError,
  wrapSqlError,
  wrapSqlErrorKeepNotFound,
} from "../Errors/RepositoryError.ts";

const FindByIdRequest = Schema.Struct({ id: Schema.String });
const FindByOrderIdRequest = Schema.Struct({ order_id: Schema.String });
const FindByIdempotencyKeyRequest = Schema.Struct({
  provider: Schema.String,
  idempotency_key: Schema.String,
});
const FindByProviderIdRequest = Schema.Struct({
  provider: Schema.String,
  provider_id: Schema.String,
});
const CreateRequest = Schema.Struct({
  order_id: Schema.String,
  provider: Schema.String,
  idempotency_key: Schema.String,
  amount_cents: Schema.Number,
  currency: Schema.String,
});
const UpdateStatusRequest = Schema.Struct({
  id: Schema.String,
  status: Schema.String,
  provider_data: Schema.Record(Schema.String, Schema.Unknown),
  error_message: Schema.NullOr(Schema.String),
});
const UpdateProviderIdRequest = Schema.Struct({
  id: Schema.String,
  provider_id: Schema.String,
  provider_data: Schema.Record(Schema.String, Schema.Unknown),
});

const JsonObject = Schema.Record(Schema.String, Schema.Unknown);

const isJsonObject = Schema.is(JsonObject);

const asRecord = (value: unknown): Record<string, unknown> =>
  isJsonObject(value) ? value : {};

const paymentRowToDomain = (row: PaymentRow): Payment =>
  new Payment({
    id: PaymentId.makeUnsafe(row.id),
    orderId: OrderId.makeUnsafe(row.order_id),
    provider: row.provider === "woovi" ? "woovi" : "stripe",
    providerId: row.provider_id,
    idempotencyKey: row.idempotency_key,
    status:
      row.status === "processing"
        ? "processing"
        : row.status === "succeeded"
          ? "succeeded"
          : row.status === "failed"
            ? "failed"
            : row.status === "cancelled"
              ? "cancelled"
              : row.status === "refunded"
                ? "refunded"
                : "pending",
    amountCents: Number(row.amount_cents),
    currency: CurrencyCode.makeUnsafe(row.currency),
    providerData: asRecord(row.provider_data),
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const findById = SqlSchema.findOneOption({
    Request: FindByIdRequest,
    Result: PaymentRow,
    execute: ({ id }) => sql`
      SELECT * FROM payment WHERE id = ${id}
    `,
  });

  const findByOrderId = SqlSchema.findAll({
    Request: FindByOrderIdRequest,
    Result: PaymentRow,
    execute: ({ order_id }) => sql`
      SELECT * FROM payment WHERE order_id = ${order_id} ORDER BY created_at DESC
    `,
  });

  const findByIdempotencyKey = SqlSchema.findOneOption({
    Request: FindByIdempotencyKeyRequest,
    Result: PaymentRow,
    execute: ({ provider, idempotency_key }) => sql`
      SELECT * FROM payment
      WHERE provider = ${provider} AND idempotency_key = ${idempotency_key}
    `,
  });

  const findByProviderId = SqlSchema.findOneOption({
    Request: FindByProviderIdRequest,
    Result: PaymentRow,
    execute: ({ provider, provider_id }) => sql`
      SELECT * FROM payment
      WHERE provider = ${provider} AND provider_id = ${provider_id}
    `,
  });

  const insertOne = SqlSchema.findOneOption({
    Request: CreateRequest,
    Result: PaymentRow,
    execute: ({
      order_id,
      provider,
      idempotency_key,
      amount_cents,
      currency,
    }) => sql`
      INSERT INTO payment (order_id, provider, idempotency_key, amount_cents, currency)
      VALUES (${order_id}, ${provider}, ${idempotency_key}, ${amount_cents}, ${currency})
      RETURNING *
    `,
  });

  const updateStatusQuery = SqlSchema.findOneOption({
    Request: UpdateStatusRequest,
    Result: PaymentRow,
    execute: ({ id, status, provider_data, error_message }) => sql`
      UPDATE payment
      SET status = ${status},
          provider_data = ${provider_data}::jsonb,
          error_message = ${error_message},
          updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `,
  });

  const updateProviderIdQuery = SqlSchema.findOneOption({
    Request: UpdateProviderIdRequest,
    Result: PaymentRow,
    execute: ({ id, provider_id, provider_data }) => sql`
      UPDATE payment
      SET provider_id = ${provider_id},
          provider_data = ${provider_data}::jsonb,
          updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `,
  });

  const create: PaymentRepositoryService["create"] = (input) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* insertOne({
        order_id: input.orderId,
        provider: input.provider,
        idempotency_key: input.idempotencyKey,
        amount_cents: input.amountCents,
        currency: input.currency,
      });
      return yield* Option.match(maybeRow, {
        onNone: () => Effect.die("INSERT RETURNING returned no rows"),
        onSome: (row) => Effect.succeed(paymentRowToDomain(row)),
      });
    });
    return pipe(effect, wrapSqlError("PaymentRepository.create"));
  };

  const getById: PaymentRepositoryService["getById"] = (id) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* findById({ id });
      const row = yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "Payment",
              entityId: id,
            })
          ),
        onSome: Effect.succeed,
      });
      return paymentRowToDomain(row);
    });
    return pipe(effect, wrapSqlErrorKeepNotFound("PaymentRepository.getById"));
  };

  const getByIdempotencyKey: PaymentRepositoryService["getByIdempotencyKey"] = (
    provider,
    idempotencyKey
  ) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* findByIdempotencyKey({
        provider,
        idempotency_key: idempotencyKey,
      });
      return Option.match(maybeRow, {
        onNone: () => null,
        onSome: paymentRowToDomain,
      });
    });
    return pipe(effect, wrapSqlError("PaymentRepository.getByIdempotencyKey"));
  };

  const getByOrderId: PaymentRepositoryService["getByOrderId"] = (orderId) => {
    const effect = Effect.gen(function* () {
      const rows = yield* findByOrderId({ order_id: orderId });
      return rows.map(paymentRowToDomain);
    });
    return pipe(effect, wrapSqlError("PaymentRepository.getByOrderId"));
  };

  const updateStatus: PaymentRepositoryService["updateStatus"] = (
    id,
    status,
    providerData,
    errorMessage
  ) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* updateStatusQuery({
        id,
        status,
        provider_data: providerData ?? {},
        error_message: errorMessage ?? null,
      });
      return yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "Payment",
              entityId: id,
            })
          ),
        onSome: (row) => Effect.succeed(paymentRowToDomain(row)),
      });
    });
    return pipe(
      effect,
      wrapSqlErrorKeepNotFound("PaymentRepository.updateStatus")
    );
  };

  const updateProviderId: PaymentRepositoryService["updateProviderId"] = (
    id,
    providerId,
    providerData
  ) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* updateProviderIdQuery({
        id,
        provider_id: providerId,
        provider_data: providerData ?? {},
      });
      return yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "Payment",
              entityId: id,
            })
          ),
        onSome: (row) => Effect.succeed(paymentRowToDomain(row)),
      });
    });
    return pipe(
      effect,
      wrapSqlErrorKeepNotFound("PaymentRepository.updateProviderId")
    );
  };

  const getByProviderId: PaymentRepositoryService["getByProviderId"] = (
    provider,
    providerId
  ) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* findByProviderId({
        provider,
        provider_id: providerId,
      });
      return Option.match(maybeRow, {
        onNone: () => null,
        onSome: paymentRowToDomain,
      });
    });
    return pipe(effect, wrapSqlError("PaymentRepository.getByProviderId"));
  };

  return {
    create,
    getById,
    getByIdempotencyKey,
    getByOrderId,
    updateStatus,
    updateProviderId,
    getByProviderId,
  } satisfies PaymentRepositoryService;
});

export const PaymentRepositoryLive = Layer.effect(PaymentRepository)(make);
