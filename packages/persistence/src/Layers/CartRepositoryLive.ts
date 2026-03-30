import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as SqlSchema from "effect/unstable/sql/SqlSchema";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { Cart } from "@starter/core/cart/Cart";
import { CartId } from "@starter/core/cart/CartId";
import { CartItem } from "@starter/core/cart/CartItem";
import { CartItemId } from "@starter/core/cart/CartItemId";
import { CustomerId } from "@starter/core/customer/CustomerId";
import { Email } from "@starter/core/shared/values/Email";
import { ProductVariantId } from "@starter/core/product/ProductVariantId";
import { CartRow } from "../Schema/CartRow.ts";
import { CartItemRow } from "../Schema/CartItemRow.ts";
import {
  CartRepository,
  type CartRepositoryService,
} from "../Services/CartRepository.ts";
import {
  EntityNotFoundError,
  wrapSqlError,
  wrapSqlErrorKeepNotFound,
} from "../Errors/RepositoryError.ts";

const FindByIdRequest = Schema.Struct({ id: Schema.String });

const CreateCartRequest = Schema.Struct({
  customer_id: Schema.NullOr(Schema.String),
  email: Schema.NullOr(Schema.String),
});

const AddItemRequest = Schema.Struct({
  cart_id: Schema.String,
  product_variant_id: Schema.String,
  quantity: Schema.Number,
  unit_price_cents: Schema.Number,
});

const UpdateQuantityRequest = Schema.Struct({
  id: Schema.String,
  quantity: Schema.Number,
});

const UpdateStatusRequest = Schema.Struct({
  id: Schema.String,
  status: Schema.String,
});

const JsonObject = Schema.Record(Schema.String, Schema.Unknown);

const isJsonObject = Schema.is(JsonObject);

const cartRowToDomain = (
  row: CartRow,
  items: ReadonlyArray<CartItem>
): Cart => {
  const metadata = isJsonObject(row.metadata) ? row.metadata : {};
  return new Cart({
    id: CartId.makeUnsafe(row.id),
    customerId:
      row.customer_id !== null ? CustomerId.makeUnsafe(row.customer_id) : null,
    email: row.email !== null ? Email.makeUnsafe(row.email) : null,
    status:
      row.status === "completed"
        ? "completed"
        : row.status === "abandoned"
          ? "abandoned"
          : "active",
    metadata,
    items: [...items],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

const cartItemRowToDomain = (row: CartItemRow): CartItem =>
  new CartItem({
    id: CartItemId.makeUnsafe(row.id),
    cartId: CartId.makeUnsafe(row.cart_id),
    productVariantId: ProductVariantId.makeUnsafe(row.product_variant_id),
    quantity: row.quantity,
    unitPriceCents: Number(row.unit_price_cents),
    createdAt: row.created_at,
  });

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const findCartById = SqlSchema.findOneOption({
    Request: FindByIdRequest,
    Result: CartRow,
    execute: ({ id }) => sql`
      SELECT * FROM cart WHERE id = ${id}
    `,
  });

  const insertCart = SqlSchema.findOneOption({
    Request: CreateCartRequest,
    Result: CartRow,
    execute: ({ customer_id, email }) => sql`
      INSERT INTO cart (customer_id, email)
      VALUES (${customer_id}, ${email})
      RETURNING *
    `,
  });

  const findItemsByCartId = SqlSchema.findAll({
    Request: FindByIdRequest,
    Result: CartItemRow,
    execute: ({ id }) => sql`
      SELECT * FROM cart_item WHERE cart_id = ${id} ORDER BY created_at
    `,
  });

  const insertItem = SqlSchema.findOneOption({
    Request: AddItemRequest,
    Result: CartItemRow,
    execute: ({
      cart_id,
      product_variant_id,
      quantity,
      unit_price_cents,
    }) => sql`
      INSERT INTO cart_item (cart_id, product_variant_id, quantity, unit_price_cents)
      VALUES (${cart_id}, ${product_variant_id}, ${quantity}, ${unit_price_cents})
      ON CONFLICT (cart_id, product_variant_id)
      DO UPDATE SET quantity = cart_item.quantity + ${quantity}
      RETURNING *
    `,
  });

  const updateItemQuantityQuery = SqlSchema.findOneOption({
    Request: UpdateQuantityRequest,
    Result: CartItemRow,
    execute: ({ id, quantity }) => sql`
      UPDATE cart_item SET quantity = ${quantity} WHERE id = ${id} RETURNING *
    `,
  });

  const deleteItemQuery = SqlSchema.findOneOption({
    Request: FindByIdRequest,
    Result: CartItemRow,
    execute: ({ id }) => sql`
      DELETE FROM cart_item WHERE id = ${id} RETURNING *
    `,
  });

  const updateStatusQuery = SqlSchema.findOneOption({
    Request: UpdateStatusRequest,
    Result: CartRow,
    execute: ({ id, status }) => sql`
      UPDATE cart SET status = ${status}, updated_at = now()
      WHERE id = ${id} RETURNING *
    `,
  });

  const create: CartRepositoryService["create"] = (input) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* insertCart({
        customer_id: input.customerId,
        email: input.email,
      });
      return yield* Option.match(maybeRow, {
        onNone: () => Effect.die("INSERT RETURNING returned no rows"),
        onSome: (row) => Effect.succeed(cartRowToDomain(row, [])),
      });
    });
    return pipe(effect, wrapSqlError("CartRepository.create"));
  };

  const getById: CartRepositoryService["getById"] = (id) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* findCartById({ id });
      const row = yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "Cart",
              entityId: id,
            })
          ),
        onSome: Effect.succeed,
      });
      const itemRows = yield* findItemsByCartId({ id });
      const items = itemRows.map(cartItemRowToDomain);
      return cartRowToDomain(row, items);
    });
    return pipe(effect, wrapSqlErrorKeepNotFound("CartRepository.getById"));
  };

  const addItem: CartRepositoryService["addItem"] = (input) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* insertItem({
        cart_id: input.cartId,
        product_variant_id: input.productVariantId,
        quantity: input.quantity,
        unit_price_cents: input.unitPriceCents,
      });
      return yield* Option.match(maybeRow, {
        onNone: () => Effect.die("INSERT RETURNING returned no rows"),
        onSome: (row) => Effect.succeed(cartItemRowToDomain(row)),
      });
    });
    return pipe(effect, wrapSqlError("CartRepository.addItem"));
  };

  const updateItemQuantity: CartRepositoryService["updateItemQuantity"] = (
    itemId,
    quantity
  ) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* updateItemQuantityQuery({
        id: itemId,
        quantity,
      });
      return yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "CartItem",
              entityId: itemId,
            })
          ),
        onSome: (row) => Effect.succeed(cartItemRowToDomain(row)),
      });
    });
    return pipe(
      effect,
      wrapSqlErrorKeepNotFound("CartRepository.updateItemQuantity")
    );
  };

  const removeItem: CartRepositoryService["removeItem"] = (itemId) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* deleteItemQuery({ id: itemId });
      yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "CartItem",
              entityId: itemId,
            })
          ),
        onSome: () => Effect.void,
      });
    });
    return pipe(effect, wrapSqlErrorKeepNotFound("CartRepository.removeItem"));
  };

  const getItemsByCartId: CartRepositoryService["getItemsByCartId"] = (
    cartId
  ) => {
    const effect = Effect.gen(function* () {
      const rows = yield* findItemsByCartId({ id: cartId });
      return rows.map(cartItemRowToDomain);
    });
    return pipe(effect, wrapSqlError("CartRepository.getItemsByCartId"));
  };

  const updateStatus: CartRepositoryService["updateStatus"] = (id, status) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* updateStatusQuery({ id, status });
      const row = yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "Cart",
              entityId: id,
            })
          ),
        onSome: Effect.succeed,
      });
      const itemRows = yield* findItemsByCartId({ id });
      const items = itemRows.map(cartItemRowToDomain);
      return cartRowToDomain(row, items);
    });
    return pipe(
      effect,
      wrapSqlErrorKeepNotFound("CartRepository.updateStatus")
    );
  };

  const deleteAbandoned: CartRepositoryService["deleteAbandoned"] = (
    retentionDays
  ) => {
    const days = retentionDays ?? 30;
    const effect = Effect.gen(function* () {
      const rows = yield* sql`
        DELETE FROM cart
        WHERE status IN ('abandoned', 'active')
          AND updated_at < now() - ${`${days} days`}::interval
        RETURNING id
      `;
      return rows.length;
    });
    return pipe(effect, wrapSqlError("CartRepository.deleteAbandoned"));
  };

  return {
    create,
    getById,
    addItem,
    updateItemQuantity,
    removeItem,
    getItemsByCartId,
    updateStatus,
    deleteAbandoned,
  } satisfies CartRepositoryService;
});

export const CartRepositoryLive = Layer.effect(CartRepository)(make);
