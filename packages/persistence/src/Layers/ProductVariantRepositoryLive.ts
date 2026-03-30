import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as SqlSchema from "effect/unstable/sql/SqlSchema";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { ProductVariantRow } from "../Schema/ProductVariantRow.ts";
import {
  ProductVariantRepository,
  type ProductVariantRepositoryService,
} from "../Services/ProductVariantRepository.ts";
import {
  InsufficientStockError,
  wrapSqlError,
  wrapSqlErrorKeepStockError,
} from "../Errors/RepositoryError.ts";

const ByProductIdRequest = Schema.Struct({
  product_id: Schema.String,
});

const ByIdRequest = Schema.Struct({
  id: Schema.String,
});

const StockCheckResult = Schema.Struct({
  stock: Schema.NullOr(Schema.Number),
});

const DecrementResult = Schema.Struct({
  id: Schema.String,
});

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const findActiveByProductId = SqlSchema.findAll({
    Request: ByProductIdRequest,
    Result: ProductVariantRow,
    execute: ({ product_id }) => sql`
      SELECT *
        FROM product_variant
       WHERE product_id = ${product_id}
         AND is_active = true
       ORDER BY created_at
    `,
  });

  const findById = SqlSchema.findOneOption({
    Request: ByIdRequest,
    Result: ProductVariantRow,
    execute: ({ id }) => sql`
      SELECT * FROM product_variant WHERE id = ${id} AND is_active = true
    `,
  });

  const findStockById = SqlSchema.findOneOption({
    Request: ByIdRequest,
    Result: StockCheckResult,
    execute: ({ id }) => sql`
      SELECT stock FROM product_variant WHERE id = ${id}
    `,
  });

  const getById: ProductVariantRepositoryService["getById"] = (id) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* findById({ id });
      return maybeRow;
    });
    return pipe(effect, wrapSqlError("ProductVariantRepository.getById"));
  };

  const listActiveByProductId: ProductVariantRepositoryService["listActiveByProductId"] =
    (productId) =>
      pipe(
        { product_id: productId },
        findActiveByProductId,
        wrapSqlError("ProductVariantRepository.listActiveByProductId")
      );

  const listActiveByProductIds: ProductVariantRepositoryService["listActiveByProductIds"] =
    (productIds) => {
      if (productIds.length === 0) {
        return Effect.succeed([]);
      }
      return pipe(
        sql`
          SELECT *
            FROM product_variant
           WHERE product_id IN ${sql.in(productIds)}
             AND is_active = true
           ORDER BY created_at
        `,
        Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(ProductVariantRow))),
        wrapSqlError("ProductVariantRepository.listActiveByProductIds")
      );
    };

  const checkStock: ProductVariantRepositoryService["checkStock"] = (
    id,
    quantity
  ) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* findStockById({ id });
      const row = yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new InsufficientStockError({
              productVariantId: id,
              requested: quantity,
              available: 0,
            })
          ),
        onSome: Effect.succeed,
      });
      // null stock means unlimited
      if (row.stock === null) {
        return;
      }
      if (row.stock < quantity) {
        return yield* new InsufficientStockError({
          productVariantId: id,
          requested: quantity,
          available: row.stock,
        });
      }
    });
    return pipe(
      effect,
      wrapSqlErrorKeepStockError("ProductVariantRepository.checkStock")
    );
  };

  const decrementStock: ProductVariantRepositoryService["decrementStock"] = (
    items
  ) => {
    const effect = Effect.gen(function* () {
      for (const item of items) {
        // Atomically decrement stock only when sufficient.
        // NULL stock (unlimited) is skipped via WHERE stock IS NOT NULL.
        const decrementQuery = SqlSchema.findOneOption({
          Request: Schema.Struct({
            id: Schema.String,
            quantity: Schema.Number,
          }),
          Result: DecrementResult,
          execute: ({ id, quantity }) => sql`
            UPDATE product_variant
               SET stock = stock - ${quantity},
                   updated_at = now()
             WHERE id = ${id}
               AND stock IS NOT NULL
               AND stock >= ${quantity}
            RETURNING id
          `,
        });
        const result = yield* decrementQuery({
          id: item.productVariantId,
          quantity: item.quantity,
        });
        // If variant has limited stock, the UPDATE must return a row.
        // If it didn't, check stock to see if the variant exists with
        // finite stock (meaning insufficient stock) vs NULL (unlimited).
        yield* Option.match(result, {
          onNone: () =>
            Effect.gen(function* () {
              const stockRow = yield* findStockById({
                id: item.productVariantId,
              });
              const stockValue = yield* Option.match(stockRow, {
                onNone: () => Effect.succeed(0),
                onSome: (r) => Effect.succeed(r.stock),
              });
              // null stock means unlimited — no decrement needed
              if (stockValue !== null) {
                return yield* new InsufficientStockError({
                  productVariantId: item.productVariantId,
                  requested: item.quantity,
                  available: stockValue,
                });
              }
            }),
          onSome: () => Effect.void,
        });
      }
    });
    return pipe(
      effect,
      wrapSqlErrorKeepStockError("ProductVariantRepository.decrementStock")
    );
  };

  const restoreStock: ProductVariantRepositoryService["restoreStock"] = (
    items
  ) => {
    const effect = Effect.gen(function* () {
      for (const item of items) {
        yield* sql`
          UPDATE product_variant
             SET stock = stock + ${item.quantity},
                 updated_at = now()
           WHERE id = ${item.productVariantId}
             AND stock IS NOT NULL
        `;
      }
    });
    return pipe(effect, wrapSqlError("ProductVariantRepository.restoreStock"));
  };

  const update: ProductVariantRepositoryService["update"] = (id, input) => {
    const effect = Effect.gen(function* () {
      const sets: Array<string> = [];
      const values: Array<unknown> = [];
      if (input.name !== undefined) {
        values.push(input.name);
        sets.push(`name = $${String(values.length)}`);
      }
      if (input.priceCents !== undefined) {
        values.push(input.priceCents);
        sets.push(`price_cents = $${String(values.length)}`);
      }
      if (input.stock !== undefined) {
        values.push(input.stock);
        sets.push(`stock = $${String(values.length)}`);
      }
      if (input.weightGrams !== undefined) {
        values.push(input.weightGrams);
        sets.push(`weight_grams = $${String(values.length)}`);
      }
      if (input.lengthCm !== undefined) {
        values.push(input.lengthCm);
        sets.push(`length_cm = $${String(values.length)}`);
      }
      if (input.widthCm !== undefined) {
        values.push(input.widthCm);
        sets.push(`width_cm = $${String(values.length)}`);
      }
      if (input.heightCm !== undefined) {
        values.push(input.heightCm);
        sets.push(`height_cm = $${String(values.length)}`);
      }
      if (sets.length === 0) {
        const existing = yield* findById({ id });
        return yield* Option.match(existing, {
          onNone: () => Effect.die("Variant not found"),
          onSome: Effect.succeed,
        });
      }
      sets.push("updated_at = now()");
      values.push(id);
      const idIdx = String(values.length);
      const setClauses = sets.join(", ");
      const query = `UPDATE product_variant SET ${setClauses} WHERE id = $${idIdx} AND is_active = true RETURNING *`;
      const rows = yield* sql.unsafe(query, values);
      const decode = Schema.decodeUnknownEffect(Schema.Array(ProductVariantRow));
      const parsed = yield* decode(rows);
      if (parsed.length === 0) {
        return yield* Effect.die("Variant not found");
      }
      return parsed[0]!;
    });
    return pipe(effect, wrapSqlError("ProductVariantRepository.update"));
  };

  const findLowStock: ProductVariantRepositoryService["findLowStock"] = (
    threshold
  ) => {
    const effect = Effect.gen(function* () {
      const rows = yield* sql`
        SELECT pv.*
          FROM product_variant pv
          JOIN product p ON p.id = pv.product_id AND p.is_active = true
         WHERE pv.is_active = true
           AND pv.stock IS NOT NULL
           AND pv.stock <= ${threshold}
         ORDER BY pv.stock ASC, pv.updated_at DESC
      `;
      const decode = Schema.decodeUnknownEffect(Schema.Array(ProductVariantRow));
      return yield* decode(rows);
    });
    return pipe(effect, wrapSqlError("ProductVariantRepository.findLowStock"));
  };

  return {
    getById,
    listActiveByProductId,
    listActiveByProductIds,
    checkStock,
    decrementStock,
    restoreStock,
    update,
    findLowStock,
  } satisfies ProductVariantRepositoryService;
});

export const ProductVariantRepositoryLive = Layer.effect(
  ProductVariantRepository,
)(make);
