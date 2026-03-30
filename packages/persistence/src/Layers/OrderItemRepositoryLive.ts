import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as SqlSchema from "effect/unstable/sql/SqlSchema";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { OrderItem } from "@starter/core/order/OrderItem";
import { OrderItemId } from "@starter/core/order/OrderItemId";
import { OrderId } from "@starter/core/order/OrderId";
import { ProductVariantId } from "@starter/core/product/ProductVariantId";
import { OrderItemRow } from "../Schema/OrderItemRow.ts";
import {
  OrderItemRepository,
  type OrderItemRepositoryService,
} from "../Services/OrderItemRepository.ts";
import { wrapSqlError } from "../Errors/RepositoryError.ts";

const FindByOrderIdRequest = Schema.Struct({
  order_id: Schema.String,
});

const CreateRequest = Schema.Struct({
  order_id: Schema.String,
  product_variant_id: Schema.String,
  product_name: Schema.String,
  variant_name: Schema.String,
  sku: Schema.NullOr(Schema.String),
  quantity: Schema.Number,
  unit_price_cents: Schema.Number,
  is_digital: Schema.Boolean,
});

const orderItemRowToDomain = (row: OrderItemRow): OrderItem =>
  new OrderItem({
    id: OrderItemId.makeUnsafe(row.id),
    orderId: OrderId.makeUnsafe(row.order_id),
    productVariantId: ProductVariantId.makeUnsafe(row.product_variant_id),
    productName: row.product_name,
    variantName: row.variant_name,
    sku: row.sku,
    quantity: row.quantity,
    unitPriceCents: Number(row.unit_price_cents),
    isDigital: row.is_digital,
    createdAt: row.created_at,
  });

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const insertOne = SqlSchema.findOneOption({
    Request: CreateRequest,
    Result: OrderItemRow,
    execute: ({
      order_id,
      product_variant_id,
      product_name,
      variant_name,
      sku,
      quantity,
      unit_price_cents,
      is_digital,
    }) => sql`
      INSERT INTO order_item (order_id, product_variant_id, product_name, variant_name, sku, quantity, unit_price_cents, is_digital)
      VALUES (${order_id}, ${product_variant_id}, ${product_name}, ${variant_name}, ${sku}, ${quantity}, ${unit_price_cents}, ${is_digital})
      RETURNING *
    `,
  });

  const findByOrderId = SqlSchema.findAll({
    Request: FindByOrderIdRequest,
    Result: OrderItemRow,
    execute: ({ order_id }) => sql`
      SELECT * FROM order_item WHERE order_id = ${order_id} ORDER BY created_at
    `,
  });

  const create: OrderItemRepositoryService["create"] = (input) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* insertOne({
        order_id: input.orderId,
        product_variant_id: input.productVariantId,
        product_name: input.productName,
        variant_name: input.variantName,
        sku: input.sku,
        quantity: input.quantity,
        unit_price_cents: input.unitPriceCents,
        is_digital: input.isDigital,
      });
      return yield* Option.match(maybeRow, {
        onNone: () => Effect.die("INSERT RETURNING returned no rows"),
        onSome: (row) => Effect.succeed(orderItemRowToDomain(row)),
      });
    });
    return pipe(effect, wrapSqlError("OrderItemRepository.create"));
  };

  const getByOrderId: OrderItemRepositoryService["getByOrderId"] = (
    orderId
  ) => {
    const effect = Effect.gen(function* () {
      const rows = yield* findByOrderId({ order_id: orderId });
      return rows.map(orderItemRowToDomain);
    });
    return pipe(effect, wrapSqlError("OrderItemRepository.getByOrderId"));
  };

  return {
    create,
    getByOrderId,
  } satisfies OrderItemRepositoryService;
});

export const OrderItemRepositoryLive = Layer.effect(OrderItemRepository)(make);
