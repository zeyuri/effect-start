import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as SqlSchema from "effect/unstable/sql/SqlSchema";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { Order } from "@starter/core/order/Order";
import { OrderId } from "@starter/core/order/OrderId";
import { ProductId } from "@starter/core/product/ProductId";
import { CustomerId } from "@starter/core/customer/CustomerId";
import { CartId } from "@starter/core/cart/CartId";
import { CurrencyCode } from "@starter/core/shared/values/CurrencyCode";
import { Email } from "@starter/core/shared/values/Email";
import { OrderRow } from "../Schema/OrderRow.ts";
import {
  OrderRepository,
  type OrderRepositoryService,
} from "../Services/OrderRepository.ts";
import {
  EntityNotFoundError,
  wrapSqlError,
  wrapSqlErrorKeepNotFound,
} from "../Errors/RepositoryError.ts";

const FindByIdRequest = Schema.Struct({ id: Schema.String });
const EmptyRequest = Schema.Struct({});

const CreateRequest = Schema.Struct({
  product_id: Schema.String,
  buyer_name: Schema.String,
  buyer_email: Schema.String,
  pix_key: Schema.String,
});

const CreateFromCartRequest = Schema.Struct({
  cart_id: Schema.String,
  customer_id: Schema.NullOr(Schema.String),
  buyer_name: Schema.String,
  buyer_email: Schema.String,
  subtotal_cents: Schema.Number,
  shipping_cents: Schema.Number,
  total_cents: Schema.Number,
  currency: Schema.String,
});

const UpdateStatusRequest = Schema.Struct({
  id: Schema.String,
  status: Schema.String,
});

const JsonObject = Schema.Record(Schema.String, Schema.Unknown);

const isJsonObject = Schema.is(JsonObject);

const orderRowToDomain = (row: OrderRow): Order => {
  const metadata = isJsonObject(row.metadata) ? row.metadata : {};
  return new Order({
    id: OrderId.makeUnsafe(row.id),
    displayId: row.display_id !== null ? Number(row.display_id) : null,
    productId:
      row.product_id !== null ? ProductId.makeUnsafe(row.product_id) : null,
    buyerName: row.buyer_name,
    buyerEmail: Email.makeUnsafe(row.buyer_email),
    status:
      row.status === "paid"
        ? "paid"
        : row.status === "awaiting_payment"
          ? "awaiting_payment"
          : row.status === "processing"
            ? "processing"
            : row.status === "shipped"
              ? "shipped"
              : row.status === "delivered"
                ? "delivered"
                : row.status === "cancelled"
                  ? "cancelled"
                  : row.status === "refunded"
                    ? "refunded"
                    : "pending",
    pixKey: row.pix_key,
    customerId:
      row.customer_id !== null ? CustomerId.makeUnsafe(row.customer_id) : null,
    cartId: row.cart_id !== null ? CartId.makeUnsafe(row.cart_id) : null,
    subtotalCents: Number(row.subtotal_cents),
    shippingCents: Number(row.shipping_cents),
    totalCents: Number(row.total_cents),
    currency: CurrencyCode.makeUnsafe(row.currency),
    metadata,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    cancelledAt: row.cancelled_at,
  });
};

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const findById = SqlSchema.findOneOption({
    Request: FindByIdRequest,
    Result: OrderRow,
    execute: ({ id }) => sql`
      SELECT * FROM "order" WHERE id = ${id}
    `,
  });

  const insertOne = SqlSchema.findOneOption({
    Request: CreateRequest,
    Result: OrderRow,
    execute: ({ product_id, buyer_name, buyer_email, pix_key }) => sql`
      INSERT INTO "order" (product_id, buyer_name, buyer_email, pix_key)
      VALUES (${product_id}, ${buyer_name}, ${buyer_email}, ${pix_key})
      RETURNING *
    `,
  });

  const insertFromCart = SqlSchema.findOneOption({
    Request: CreateFromCartRequest,
    Result: OrderRow,
    execute: ({
      cart_id,
      customer_id,
      buyer_name,
      buyer_email,
      subtotal_cents,
      shipping_cents,
      total_cents,
      currency,
    }) => sql`
      INSERT INTO "order" (cart_id, customer_id, buyer_name, buyer_email, pix_key, subtotal_cents, shipping_cents, total_cents, currency)
      VALUES (${cart_id}, ${customer_id}, ${buyer_name}, ${buyer_email}, '', ${subtotal_cents}, ${shipping_cents}, ${total_cents}, ${currency})
      RETURNING *
    `,
  });

  const markPaidQuery = SqlSchema.findOneOption({
    Request: FindByIdRequest,
    Result: OrderRow,
    execute: ({ id }) => sql`
      UPDATE "order"
      SET status = 'paid', paid_at = now()
      WHERE id = ${id}
      RETURNING *
    `,
  });

  const updateStatusQuery = SqlSchema.findOneOption({
    Request: UpdateStatusRequest,
    Result: OrderRow,
    execute: ({ id, status }) => sql`
      UPDATE "order"
      SET status = ${status}
      WHERE id = ${id}
      RETURNING *
    `,
  });

  const findAll = SqlSchema.findAll({
    Request: EmptyRequest,
    Result: OrderRow,
    execute: () => sql`
      SELECT * FROM "order" ORDER BY created_at DESC
    `,
  });

  const findByBuyerEmail = SqlSchema.findAll({
    Request: Schema.Struct({ buyer_email: Schema.String }),
    Result: OrderRow,
    execute: ({ buyer_email }) => sql`
      SELECT * FROM "order" WHERE buyer_email = ${buyer_email} ORDER BY created_at DESC
    `,
  });

  const create: OrderRepositoryService["create"] = (input) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* insertOne({
        product_id: input.productId,
        buyer_name: input.buyerName,
        buyer_email: input.buyerEmail,
        pix_key: input.pixKey,
      });
      return yield* Option.match(maybeRow, {
        onNone: () => Effect.die("INSERT RETURNING returned no rows"),
        onSome: (row) => Effect.succeed(orderRowToDomain(row)),
      });
    });
    return pipe(effect, wrapSqlError("OrderRepository.create"));
  };

  const createFromCart: OrderRepositoryService["createFromCart"] = (input) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* insertFromCart({
        cart_id: input.cartId,
        customer_id: input.customerId,
        buyer_name: input.buyerName,
        buyer_email: input.buyerEmail,
        subtotal_cents: input.subtotalCents,
        shipping_cents: input.shippingCents,
        total_cents: input.totalCents,
        currency: input.currency,
      });
      return yield* Option.match(maybeRow, {
        onNone: () => Effect.die("INSERT RETURNING returned no rows"),
        onSome: (row) => Effect.succeed(orderRowToDomain(row)),
      });
    });
    return pipe(effect, wrapSqlError("OrderRepository.createFromCart"));
  };

  const getById: OrderRepositoryService["getById"] = (id) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* findById({ id });
      const row = yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "Order",
              entityId: id,
            })
          ),
        onSome: Effect.succeed,
      });
      return orderRowToDomain(row);
    });
    return pipe(effect, wrapSqlErrorKeepNotFound("OrderRepository.getById"));
  };

  const markPaid: OrderRepositoryService["markPaid"] = (id) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* markPaidQuery({ id });
      return yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "Order",
              entityId: id,
            })
          ),
        onSome: (row) => Effect.succeed(orderRowToDomain(row)),
      });
    });
    return pipe(effect, wrapSqlErrorKeepNotFound("OrderRepository.markPaid"));
  };

  const updateStatus: OrderRepositoryService["updateStatus"] = (id, status) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* updateStatusQuery({ id, status });
      return yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "Order",
              entityId: id,
            })
          ),
        onSome: (row) => Effect.succeed(orderRowToDomain(row)),
      });
    });
    return pipe(
      effect,
      wrapSqlErrorKeepNotFound("OrderRepository.updateStatus")
    );
  };

  const listAll: OrderRepositoryService["listAll"] = () => {
    const effect = Effect.gen(function* () {
      const rows = yield* findAll({});
      return rows.map(orderRowToDomain);
    });
    return pipe(effect, wrapSqlError("OrderRepository.listAll"));
  };

  const listByBuyerEmail: OrderRepositoryService["listByBuyerEmail"] = (
    email
  ) => {
    const effect = Effect.gen(function* () {
      const rows = yield* findByBuyerEmail({ buyer_email: email });
      return rows.map(orderRowToDomain);
    });
    return pipe(effect, wrapSqlError("OrderRepository.listByBuyerEmail"));
  };

  const StatusCountRow = Schema.Struct({
    status: Schema.String,
    count: Schema.String,
  });

  const countByStatus: OrderRepositoryService["countByStatus"] = () => {
    const effect = Effect.gen(function* () {
      const rows = yield* sql`
        SELECT status, COUNT(*)::text AS count
        FROM "order"
        GROUP BY status
      `;
      const decodeStatusCounts = Schema.decodeUnknownEffect(
        Schema.Array(StatusCountRow)
      );
      const parsed = yield* decodeStatusCounts(rows);
      return parsed.map((r) => ({
        status: r.status,
        count: Number(r.count),
      }));
    });
    return pipe(effect, wrapSqlError("OrderRepository.countByStatus"));
  };

  const RevenueRow = Schema.Struct({
    total: Schema.NullOr(Schema.String),
  });

  const totalRevenue: OrderRepositoryService["totalRevenue"] = () => {
    const effect = Effect.gen(function* () {
      const rows = yield* sql`
        SELECT COALESCE(SUM(total_cents), 0)::text AS total
        FROM "order"
        WHERE status IN ('paid', 'processing', 'shipped', 'delivered')
      `;
      const decodeRevenue = Schema.decodeUnknownEffect(
        Schema.Array(RevenueRow)
      );
      const parsed = yield* decodeRevenue(rows);
      if (parsed.length === 0) {
        return 0;
      }
      const row = parsed[0]!;
      if (row.total === null) {
        return 0;
      }
      return Number(row.total);
    });
    return pipe(effect, wrapSqlError("OrderRepository.totalRevenue"));
  };

  return {
    create,
    createFromCart,
    getById,
    markPaid,
    updateStatus,
    listAll,
    listByBuyerEmail,
    countByStatus,
    totalRevenue,
  } satisfies OrderRepositoryService;
});

export const OrderRepositoryLive = Layer.effect(OrderRepository)(make);
