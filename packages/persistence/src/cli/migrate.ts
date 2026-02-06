import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { Migrations } from "../Layers/MigrationsLive.ts";
import { MigrationsLive } from "../Layers/MigrationsLive.ts";
import { PgClientLive } from "../Layers/DbLive.ts";

const program = Effect.gen(function* () {
  const migrations = yield* Migrations;
  const executed = yield* migrations.run;

  if (executed.length === 0) {
    yield* Effect.logInfo("No migrations to run.");
    return;
  }

  const names = executed.map((entry) => `${entry[0]}_${entry[1]}`).join(", ");
  yield* Effect.logInfo(`Applied migrations: ${names}.`);
});

const appLayer = Layer.provide(MigrationsLive, PgClientLive);

// eslint-disable-next-line effect/no-runPromise -- CLI entry point
void Effect.runPromise(Effect.provide(program, appLayer));
