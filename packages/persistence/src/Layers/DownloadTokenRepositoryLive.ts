import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as SqlSchema from "effect/unstable/sql/SqlSchema";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { OrderId } from "@starter/core/order/OrderId";
import { ProductVariantId } from "@starter/core/product/ProductVariantId";
import { DownloadTokenId } from "@starter/core/shared/values/DownloadTokenId";
import {
  DownloadTokenRepository,
  type DownloadTokenRepositoryService,
  type DownloadToken,
} from "../Services/DownloadTokenRepository.ts";
import { wrapSqlError } from "../Errors/RepositoryError.ts";

const DownloadTokenRow = Schema.Struct({
  id: Schema.String,
  order_id: Schema.String,
  product_variant_id: Schema.String,
  token: Schema.String,
  used_at: Schema.NullOr(Schema.Date),
  expires_at: Schema.Date,
  created_at: Schema.Date,
});

type DownloadTokenRow = typeof DownloadTokenRow.Type;

const InsertRequest = Schema.Struct({
  order_id: Schema.String,
  product_variant_id: Schema.String,
  token: Schema.String,
  expires_at: Schema.Date,
});

const ByTokenRequest = Schema.Struct({
  token: Schema.String,
});

const ByIdRequest = Schema.Struct({
  id: Schema.String,
});

const rowToDomain = (row: DownloadTokenRow): DownloadToken => ({
  id: DownloadTokenId.makeUnsafe(row.id),
  orderId: OrderId.makeUnsafe(row.order_id),
  productVariantId: ProductVariantId.makeUnsafe(row.product_variant_id),
  token: row.token,
  usedAt: row.used_at,
  expiresAt: row.expires_at,
});

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const insertOne = SqlSchema.findOneOption({
    Request: InsertRequest,
    Result: DownloadTokenRow,
    execute: ({ order_id, product_variant_id, token, expires_at }) => sql`
      INSERT INTO download_token (order_id, product_variant_id, token, expires_at)
      VALUES (${order_id}, ${product_variant_id}, ${token}, ${expires_at})
      RETURNING *
    `,
  });

  const findByToken = SqlSchema.findOneOption({
    Request: ByTokenRequest,
    Result: DownloadTokenRow,
    execute: ({ token }) => sql`
      SELECT * FROM download_token WHERE token = ${token}
    `,
  });

  const markUsedQuery = SqlSchema.findOneOption({
    Request: ByIdRequest,
    Result: DownloadTokenRow,
    execute: ({ id }) => sql`
      UPDATE download_token SET used_at = now() WHERE id = ${id} RETURNING *
    `,
  });

  const create: DownloadTokenRepositoryService["create"] = (
    orderId,
    productVariantId,
    token,
    expiresAt
  ) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* insertOne({
        order_id: orderId,
        product_variant_id: productVariantId,
        token,
        expires_at: expiresAt,
      });
      return yield* Option.match(maybeRow, {
        onNone: () => Effect.die("INSERT RETURNING returned no rows"),
        onSome: (row) => Effect.succeed(rowToDomain(row)),
      });
    });
    return pipe(effect, wrapSqlError("DownloadTokenRepository.create"));
  };

  const getByToken: DownloadTokenRepositoryService["getByToken"] = (token) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* findByToken({ token });
      return Option.map(maybeRow, rowToDomain);
    });
    return pipe(effect, wrapSqlError("DownloadTokenRepository.getByToken"));
  };

  const markUsed: DownloadTokenRepositoryService["markUsed"] = (id) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* markUsedQuery({ id });
      yield* Option.match(maybeRow, {
        onNone: () => Effect.die("UPDATE RETURNING returned no rows"),
        onSome: () => Effect.void,
      });
    });
    return pipe(effect, wrapSqlError("DownloadTokenRepository.markUsed"));
  };

  return {
    create,
    getByToken,
    markUsed,
  } satisfies DownloadTokenRepositoryService;
});

export const DownloadTokenRepositoryLive = Layer.effect(
  DownloadTokenRepository
)(make);
