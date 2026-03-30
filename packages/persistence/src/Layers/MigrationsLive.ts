import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as ServiceMap from "effect/ServiceMap";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { pipe } from "effect/Function";
import {
  type PersistenceError,
  wrapSqlError,
} from "../Errors/RepositoryError.ts";
import { migrations } from "../Migrations/index.ts";

type MigrationResult = ReadonlyArray<readonly [number, string]>;
type MigrationEffect = Effect.Effect<MigrationResult, PersistenceError>;

export class Migrations extends ServiceMap.Service<
  Migrations,
  {
    readonly run: MigrationEffect;
    readonly runOnce: MigrationEffect;
  }
>()("@starter/persistence/Layers/MigrationsLive/Migrations") {}

const makeRunMigrations = (sql: SqlClient.SqlClient): MigrationEffect => {
  const txn = sql.withTransaction(
    Effect.gen(function* () {
      yield* sql`
        CREATE TABLE IF NOT EXISTS effect_sql_migrations (
          migration_id integer primary key,
          created_at timestamptz not null default now(),
          name text not null
        )
      `.raw;

      const rows = yield* sql`
        SELECT migration_id FROM effect_sql_migrations
      `;

      const applied = new Set(rows.map((row) => Number(row["migration_id"])));

      const executed: Array<readonly [number, string]> = [];

      for (const migration of migrations) {
        if (applied.has(migration.id)) {
          continue;
        }
        yield* sql.unsafe(migration.sql).raw;
        yield* sql`
          INSERT INTO effect_sql_migrations
            (migration_id, name)
          VALUES
            (${migration.id}, ${migration.name})
        `.raw;
        executed.push([migration.id, migration.name]);
      }

      return executed;
    })
  );
  return pipe(txn, wrapSqlError("Migrations.run"));
};

export const runMigrations = Effect.flatMap(
  SqlClient.SqlClient.asEffect(),
  makeRunMigrations
);

export const MigrationsLive = Layer.effect(Migrations)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const run = makeRunMigrations(sql);
    const runOnce = yield* Effect.cached(run);
    return {
      run,
      runOnce,
    };
  })
);
