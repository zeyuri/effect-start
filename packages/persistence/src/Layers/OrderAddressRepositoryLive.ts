import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as SqlSchema from "effect/unstable/sql/SqlSchema";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { OrderAddress } from "@starter/core/order/OrderAddress";
import { OrderAddressId } from "@starter/core/order/OrderAddressId";
import { OrderId } from "@starter/core/order/OrderId";
import { OrderAddressRow } from "../Schema/OrderAddressRow.ts";
import {
  OrderAddressRepository,
  type OrderAddressRepositoryService,
} from "../Services/OrderAddressRepository.ts";
import { wrapSqlError } from "../Errors/RepositoryError.ts";

const FindByOrderIdRequest = Schema.Struct({
  order_id: Schema.String,
});

const CreateRequest = Schema.Struct({
  order_id: Schema.String,
  type: Schema.String,
  full_name: Schema.String,
  line1: Schema.String,
  line2: Schema.NullOr(Schema.String),
  city: Schema.String,
  state: Schema.String,
  postal_code: Schema.String,
  country: Schema.String,
  phone: Schema.NullOr(Schema.String),
});

const orderAddressRowToDomain = (row: OrderAddressRow): OrderAddress =>
  new OrderAddress({
    id: OrderAddressId.makeUnsafe(row.id),
    orderId: OrderId.makeUnsafe(row.order_id),
    type: row.type === "billing" ? "billing" : "shipping",
    fullName: row.full_name,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    phone: row.phone,
    createdAt: row.created_at,
  });

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const insertOne = SqlSchema.findOneOption({
    Request: CreateRequest,
    Result: OrderAddressRow,
    execute: ({
      order_id,
      type,
      full_name,
      line1,
      line2,
      city,
      state,
      postal_code,
      country,
      phone,
    }) => sql`
      INSERT INTO order_address (order_id, type, full_name, line1, line2, city, state, postal_code, country, phone)
      VALUES (${order_id}, ${type}, ${full_name}, ${line1}, ${line2}, ${city}, ${state}, ${postal_code}, ${country}, ${phone})
      RETURNING *
    `,
  });

  const findByOrderId = SqlSchema.findAll({
    Request: FindByOrderIdRequest,
    Result: OrderAddressRow,
    execute: ({ order_id }) => sql`
      SELECT * FROM order_address WHERE order_id = ${order_id} ORDER BY type
    `,
  });

  const create: OrderAddressRepositoryService["create"] = (input) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* insertOne({
        order_id: input.orderId,
        type: input.type,
        full_name: input.fullName,
        line1: input.line1,
        line2: input.line2,
        city: input.city,
        state: input.state,
        postal_code: input.postalCode,
        country: input.country,
        phone: input.phone,
      });
      return yield* Option.match(maybeRow, {
        onNone: () => Effect.die("INSERT RETURNING returned no rows"),
        onSome: (row) => Effect.succeed(orderAddressRowToDomain(row)),
      });
    });
    return pipe(effect, wrapSqlError("OrderAddressRepository.create"));
  };

  const getByOrderId: OrderAddressRepositoryService["getByOrderId"] = (
    orderId
  ) => {
    const effect = Effect.gen(function* () {
      const rows = yield* findByOrderId({ order_id: orderId });
      return rows.map(orderAddressRowToDomain);
    });
    return pipe(effect, wrapSqlError("OrderAddressRepository.getByOrderId"));
  };

  return {
    create,
    getByOrderId,
  } satisfies OrderAddressRepositoryService;
});

export const OrderAddressRepositoryLive = Layer.effect(
  OrderAddressRepository,
)(make);
