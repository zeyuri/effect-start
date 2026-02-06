import { PgClient } from "@effect/sql-pg";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

const UrlConfig = Config.redacted("DATABASE_URL");

export const PgClientLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const url = yield* UrlConfig;
    return PgClient.layer({ url });
  })
);
