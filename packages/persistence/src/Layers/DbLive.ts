import { PgClient } from "@effect/sql-pg";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

export const PgClientLive = Layer.unwrap(
  Effect.gen(function* () {
    const url = yield* Config.redacted("DATABASE_URL");
    return PgClient.layer({ url });
  })
);
