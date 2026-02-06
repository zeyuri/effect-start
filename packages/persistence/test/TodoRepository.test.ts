import { describe, expect, it } from "@effect/vitest";
import { PgClient } from "@effect/sql-pg";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Redacted from "effect/Redacted";
import { inject } from "vitest";
import { runMigrations } from "../src/Layers/MigrationsLive.ts";
import { TodoRepository } from "../src/Services/TodoRepository.ts";
import { TodoRepositoryLive } from "../src/Layers/TodoRepositoryLive.ts";

const BasePgClientLive = PgClient.layer({
  url: Redacted.make(inject("dbUrl")),
});

let migrationsRan = false;

const ensureMigrationsOnce = Effect.gen(function* () {
  if (migrationsRan) {
    return;
  }
  yield* runMigrations;
  migrationsRan = true;
});

const SharedPgClientLive = Layer.effectDiscard(ensureMigrationsOnce).pipe(
  Layer.provideMerge(BasePgClientLive),
);

const TestLayer = TodoRepositoryLive.pipe(
  Layer.provideMerge(SharedPgClientLive),
);

describe("TodoRepository", () => {
  it.layer(TestLayer, { timeout: "60 seconds" })(
    "TodoRepository",
    (it) => {
      it.effect("can create and list todos", () =>
        Effect.gen(function* () {
          const repo = yield* TodoRepository;

          const created = yield* repo.create({
            title: "Test todo",
          });
          expect(created.title).toBe("Test todo");
          expect(created.completed).toBe(false);

          const todos = yield* repo.list();
          expect(todos.length).toBeGreaterThanOrEqual(1);
        }),
      );

      it.effect("can get by id", () =>
        Effect.gen(function* () {
          const repo = yield* TodoRepository;
          const created = yield* repo.create({
            title: "Find me",
          });

          const found = yield* repo.getById(created.id);
          expect(found.title).toBe("Find me");
        }),
      );

      it.effect("can update a todo", () =>
        Effect.gen(function* () {
          const repo = yield* TodoRepository;
          const created = yield* repo.create({
            title: "Before update",
          });

          const updated = yield* repo.update(created.id, {
            title: Option.some("After update"),
            completed: Option.some(true),
          });
          expect(updated.title).toBe("After update");
          expect(updated.completed).toBe(true);
        }),
      );

      it.effect("can remove a todo", () =>
        Effect.gen(function* () {
          const repo = yield* TodoRepository;
          const created = yield* repo.create({
            title: "Delete me",
          });

          yield* repo.remove(created.id);

          const result = yield* Effect.either(repo.getById(created.id));
          expect(result._tag).toBe("Left");
        }),
      );
    },
  );
});
