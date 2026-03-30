import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import {
  type PersistenceError,
  wrapSqlError,
} from "../Errors/RepositoryError.ts";
import { PgClientLive } from "../Layers/DbLive.ts";
import { seeds } from "../Seeds/index.ts";

type SeedResult = ReadonlyArray<readonly [number, string]>;

const runSeeds = (
  sql: SqlClient.SqlClient
): Effect.Effect<SeedResult, PersistenceError> => {
  const txn = sql.withTransaction(
    Effect.gen(function* () {
      yield* sql`
        CREATE TABLE IF NOT EXISTS effect_sql_seeds (
          seed_id integer primary key,
          created_at timestamptz not null default now(),
          name text not null
        )
      `.raw;

      const rows = yield* sql`
        SELECT seed_id FROM effect_sql_seeds
      `;

      const applied = new Set(rows.map((row) => Number(row["seed_id"])));

      const executed: Array<readonly [number, string]> = [];

      for (const seed of seeds) {
        if (applied.has(seed.id)) {
          continue;
        }
        yield* sql.unsafe(seed.sql).raw;
        yield* sql`
          INSERT INTO effect_sql_seeds
            (seed_id, name)
          VALUES
            (${seed.id}, ${seed.name})
        `.raw;
        executed.push([seed.id, seed.name]);
      }

      return executed;
    })
  );

  return pipe(txn, wrapSqlError("Seeds.run"));
};

const program = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  const executed = yield* runSeeds(sql);

  if (executed.length === 0) {
    yield* Effect.logInfo("No seeds to run.");
    return;
  }

  const names = executed.map((entry) => `${entry[0]}_${entry[1]}`).join(", ");
  yield* Effect.logInfo(`Applied seeds: ${names}.`);
});

// eslint-disable-next-line effect/no-runPromise -- CLI entry point
void Effect.runPromise(
  Layer.launch(Layer.provide(Layer.effectDiscard(program), PgClientLive))
);
