import { AppApi } from "@starter/api-contract/AppApi";
import { PgClientLive } from "@starter/persistence/Layers/DbLive";
import {
  Migrations,
  MigrationsLive,
} from "@starter/persistence/Layers/MigrationsLive";
import { RepositoriesLive } from "@starter/persistence/Layers/RepositoriesLive";
import * as HttpApiBuilder from "effect/unstable/httpapi/HttpApiBuilder";
import * as HttpRouter from "effect/unstable/http/HttpRouter";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import { TodosApiLive } from "./todos/TodosApiLive.js";

const ServerLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const port = yield* pipe("PORT", Config.int, Config.withDefault(3000));
    return BunHttpServer.layer({ port });
  })
);

const PersistenceLive = pipe(
  RepositoriesLive,
  Layer.provideMerge(MigrationsLive),
  Layer.provide(PgClientLive)
);

const RunMigrations = Layer.effectDiscard(
  Effect.gen(function* () {
    const migrations = yield* Migrations;
    yield* migrations.runOnce;
  })
);

const HttpApiRoutes = pipe(
  AppApi,
  HttpApiBuilder.layer,
  Layer.provide(TodosApiLive),
  Layer.provide(RunMigrations),
  Layer.provide(PersistenceLive)
);

const HealthRoute = HttpRouter.use((router) =>
  router.add(
    "GET",
    "/health",
    Effect.sync(() =>
      HttpServerResponse.jsonUnsafe({
        status: "ok",
        timestamp: new Date().toISOString(),
      })
    )
  )
);

const CorsMiddleware = HttpRouter.cors({
  allowedOrigins: [
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3333",
    "http://localhost:3334",
  ],
});

const AllRoutes = pipe(
  Layer.mergeAll(HttpApiRoutes, HealthRoute),
  Layer.provide(CorsMiddleware)
);

pipe(
  AllRoutes,
  HttpRouter.serve,
  Layer.provide(ServerLive),
  Layer.launch,
  BunRuntime.runMain
);
