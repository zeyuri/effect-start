import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import {
  ShippingQuoteRepository,
  type ShippingQuoteRepositoryService,
} from "../Services/ShippingQuoteRepository.ts";
import { wrapSqlError } from "../Errors/RepositoryError.ts";

const DEFAULT_RETENTION_DAYS = 7;

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const deleteExpired: ShippingQuoteRepositoryService["deleteExpired"] = (
    retentionDays
  ) => {
    const days = retentionDays ?? DEFAULT_RETENTION_DAYS;
    const effect = Effect.gen(function* () {
      const rows = yield* sql`
        DELETE FROM shipping_quote
        WHERE status = 'quoted'
          AND expires_at IS NOT NULL
          AND expires_at < now() - ${days + " days"}::interval
        RETURNING id
      `;
      return rows.length;
    });
    return pipe(effect, wrapSqlError("ShippingQuoteRepository.deleteExpired"));
  };

  return {
    deleteExpired,
  } satisfies ShippingQuoteRepositoryService;
});

export const ShippingQuoteRepositoryLive = Layer.effect(
  ShippingQuoteRepository,
)(make);
