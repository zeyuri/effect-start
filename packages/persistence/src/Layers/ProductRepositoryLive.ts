import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as SqlSchema from "effect/unstable/sql/SqlSchema";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { Product } from "@starter/core/product/Product";
import { ProductId } from "@starter/core/product/ProductId";
import { ProductVariant } from "@starter/core/product/ProductVariant";
import { ProductVariantId } from "@starter/core/product/ProductVariantId";
import { CurrencyCode } from "@starter/core/shared/values/CurrencyCode";
import { ProductRow } from "../Schema/ProductRow.ts";
import type { ProductVariantRow } from "../Schema/ProductVariantRow.ts";
import {
  ProductRepository,
  type ProductRepositoryService,
} from "../Services/ProductRepository.ts";
import { ProductVariantRepository } from "../Services/ProductVariantRepository.ts";
import {
  EntityNotFoundError,
  wrapSqlError,
  wrapSqlErrorKeepNotFound,
} from "../Errors/RepositoryError.ts";

const FindByIdRequest = Schema.Struct({ id: Schema.String });
const EmptyRequest = Schema.Struct({});
const CreateProductRequest = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
  image_url: Schema.String,
  price_cents: Schema.Int,
});

const variantRowToDomain = (row: ProductVariantRow): ProductVariant =>
  new ProductVariant({
    id: ProductVariantId.makeUnsafe(row.id),
    name: row.name,
    priceInCents: Number(row.price_cents),
    currency: CurrencyCode.makeUnsafe(row.currency),
    isDigital: row.is_digital,
  });

const productRowToDomain = (
  row: ProductRow,
  variants: ReadonlyArray<ProductVariant>
): Product =>
  new Product({
    id: ProductId.makeUnsafe(row.id),
    name: row.name,
    description: row.description ?? "",
    imageUrl: row.image_url ?? "",
    priceCents: row.price_cents,
    variants: [...variants],
  });

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  const variantRepo = yield* ProductVariantRepository;

  const findById = SqlSchema.findOneOption({
    Request: FindByIdRequest,
    Result: ProductRow,
    execute: ({ id }) => sql`
      SELECT * FROM product WHERE id = ${id} AND is_active = true
    `,
  });

  const insertOne = SqlSchema.findOneOption({
    Request: CreateProductRequest,
    Result: ProductRow,
    execute: ({ name, description, image_url, price_cents }) => sql`
      INSERT INTO product (name, description, image_url, price_cents)
      VALUES (${name}, ${description}, ${image_url}, ${price_cents})
      RETURNING *
    `,
  });

  const listActiveRows = SqlSchema.findAll({
    Request: EmptyRequest,
    Result: ProductRow,
    execute: () => sql`
      SELECT * FROM product WHERE is_active = true ORDER BY created_at
    `,
  });

  const list: ProductRepositoryService["list"] = () => {
    const effect = Effect.gen(function* () {
      const rows = yield* listActiveRows({});
      const productIds = rows.map((r) => ProductId.makeUnsafe(r.id));

      if (productIds.length === 0) {
        return [];
      }

      const variantRows = yield* variantRepo.listActiveByProductIds(productIds);

      const variantsByProduct = new Map<string, Array<ProductVariant>>();
      for (const vr of variantRows) {
        const domainVariant = variantRowToDomain(vr);
        const existing = variantsByProduct.get(vr.product_id);
        if (existing !== undefined) {
          existing.push(domainVariant);
        } else {
          variantsByProduct.set(vr.product_id, [domainVariant]);
        }
      }

      const products: Array<Product> = [];
      for (const row of rows) {
        const variants = variantsByProduct.get(row.id) ?? [];
        products.push(productRowToDomain(row, variants));
      }

      return products;
    });
    return pipe(effect, wrapSqlError("ProductRepository.list"));
  };

  const getById: ProductRepositoryService["getById"] = (id) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* findById({ id });
      const row = yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "Product",
              entityId: id,
            })
          ),
        onSome: Effect.succeed,
      });

      const variantRows = yield* variantRepo.listActiveByProductId(id);

      const variants = variantRows.map(variantRowToDomain);
      return productRowToDomain(row, variants);
    });
    return pipe(effect, wrapSqlErrorKeepNotFound("ProductRepository.getById"));
  };

  const create: ProductRepositoryService["create"] = (input) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* insertOne({
        name: input.name,
        description: input.description,
        image_url: input.imageUrl,
        price_cents: input.priceCents,
      });
      return yield* Option.match(maybeRow, {
        onNone: () => Effect.die("INSERT RETURNING returned no rows"),
        onSome: (row) => Effect.succeed(productRowToDomain(row, [])),
      });
    });
    return pipe(effect, wrapSqlError("ProductRepository.create"));
  };

  const update: ProductRepositoryService["update"] = (id, input) => {
    const effect = Effect.gen(function* () {
      const sets: Array<string> = [];
      const values: Array<unknown> = [];
      if (input.name !== undefined) {
        values.push(input.name);
        sets.push(`name = $${String(values.length)}`);
      }
      if (input.description !== undefined) {
        values.push(input.description);
        sets.push(`description = $${String(values.length)}`);
      }
      if (input.imageUrl !== undefined) {
        values.push(input.imageUrl);
        sets.push(`image_url = $${String(values.length)}`);
      }
      if (input.priceCents !== undefined) {
        values.push(input.priceCents);
        sets.push(`price_cents = $${String(values.length)}`);
      }
      if (sets.length === 0) {
        return yield* getById(id);
      }
      sets.push("updated_at = now()");
      values.push(id);
      const idIdx = String(values.length);
      const setClauses = sets.join(", ");
      const query = `UPDATE product SET ${setClauses} WHERE id = $${idIdx} AND is_active = true RETURNING *`;
      const rows = yield* sql.unsafe(query, values);
      const decode = Schema.decodeUnknownEffect(Schema.Array(ProductRow));
      const parsed = yield* decode(rows);
      if (parsed.length === 0) {
        return yield* new EntityNotFoundError({
          entityType: "Product",
          entityId: id,
        });
      }
      const row = parsed[0]!;
      const variantRows = yield* variantRepo.listActiveByProductId(id);
      const variants = variantRows.map(variantRowToDomain);
      return productRowToDomain(row, variants);
    });
    return pipe(effect, wrapSqlErrorKeepNotFound("ProductRepository.update"));
  };

  const softDelete = SqlSchema.findOneOption({
    Request: FindByIdRequest,
    Result: ProductRow,
    execute: ({ id: prodId }) => sql`
      UPDATE product
      SET is_active = false, updated_at = now()
      WHERE id = ${prodId} AND is_active = true
      RETURNING *
    `,
  });

  const remove: ProductRepositoryService["remove"] = (id) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* softDelete({ id });
      yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "Product",
              entityId: id,
            })
          ),
        onSome: () => Effect.void,
      });
    });
    return pipe(effect, wrapSqlErrorKeepNotFound("ProductRepository.remove"));
  };

  return {
    list,
    getById,
    create,
    update,
    remove,
  } satisfies ProductRepositoryService;
});

export const ProductRepositoryLive = Layer.effect(ProductRepository)(make);
