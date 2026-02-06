import { describe, expect, it } from "@effect/vitest";
import {
  Todo,
  TodoId,
  TodoNotFoundError,
} from "@starter/api-contract/TodoSchema";
import { EntityNotFoundError } from "@starter/persistence/Errors/RepositoryError";
import {
  TodoRepository,
  type TodoRepositoryService,
} from "@starter/persistence/Services/TodoRepository";
import * as DateTime from "effect/DateTime";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import {
  createTodo,
  getTodoById,
  listTodos,
  removeTodo,
  updateTodo,
} from "../../src/todos/TodosApiLive.ts";

const makeTodo = (title: string, id: string = crypto.randomUUID()) =>
  Todo.make({
    id: TodoId.make(id),
    title,
    completed: false,
    createdAt: DateTime.unsafeNow(),
  });

const createTestLayer = (initialTodos: ReadonlyArray<typeof Todo.Type> = []) => {
  const store = [...initialTodos];

  return Layer.effect(
    TodoRepository,
    Effect.sync(() => {
      const service: TodoRepositoryService = {
        list: () => Effect.succeed([...store]),
        getById: (id) => {
          const todo = store.find((item) => item.id === id);
          return todo
            ? Effect.succeed(todo)
            : Effect.fail(
                new EntityNotFoundError({
                  entityType: "Todo",
                  entityId: id,
                })
              );
        },
        create: (input) => {
          const todo = makeTodo(input.title);
          store.unshift(todo);
          return Effect.succeed(todo);
        },
        update: (id, input) => {
          const index = store.findIndex((item) => item.id === id);
          if (index === -1) {
            return Effect.fail(
              new EntityNotFoundError({
                entityType: "Todo",
                entityId: id,
              })
            );
          }

          const current = store[index];
          if (current === undefined) {
            return Effect.fail(
              new EntityNotFoundError({
                entityType: "Todo",
                entityId: id,
              })
            );
          }

          const nextTodo = Todo.make({
            ...current,
            title: Option.getOrElse(input.title, () => current.title),
            completed: Option.getOrElse(input.completed, () => current.completed),
          });

          store[index] = nextTodo;
          return Effect.succeed(nextTodo);
        },
        remove: (id) => {
          const index = store.findIndex((item) => item.id === id);
          if (index === -1) {
            return Effect.fail(
              new EntityNotFoundError({
                entityType: "Todo",
                entityId: id,
              })
            );
          }

          store.splice(index, 1);
          return Effect.void;
        },
      };

      return service;
    })
  );
};

describe("TodosApiLive (integration)", () => {
  it.effect("lists todos from repository", () =>
    Effect.gen(function* () {
      const seed = [makeTodo("First todo")];
      const result = yield* listTodos().pipe(Effect.provide(createTestLayer(seed)));
      expect(result).toEqual(seed);
    })
  );

  it.effect("maps repository not found into TodoNotFoundError", () =>
    Effect.gen(function* () {
      const id = TodoId.make("missing-id");
      const result = yield* getTodoById(id).pipe(
        Effect.provide(createTestLayer()),
        Effect.either
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(TodoNotFoundError);
      }
    })
  );

  it.effect("updates todo completion", () =>
    Effect.gen(function* () {
      const todo = makeTodo("Todo to update");
      const updated = yield* updateTodo(todo.id, {
        title: Option.none(),
        completed: Option.some(true),
      }).pipe(Effect.provide(createTestLayer([todo])));

      expect(updated.completed).toBe(true);
    })
  );

  it.effect("removes existing todo", () =>
    Effect.gen(function* () {
      const todo = makeTodo("Todo to remove");
      const layer = createTestLayer([todo]);

      yield* removeTodo(todo.id).pipe(Effect.provide(layer));

      const afterRemoval = yield* getTodoById(todo.id).pipe(
        Effect.provide(layer),
        Effect.either
      );

      expect(afterRemoval._tag).toBe("Left");
    })
  );

  it.effect("creates new todo", () =>
    Effect.gen(function* () {
      const layer = createTestLayer();
      const created = yield* createTodo({ title: "Created from integration test" }).pipe(
        Effect.provide(layer)
      );

      const listed = yield* listTodos().pipe(Effect.provide(layer));

      expect(created.title).toBe("Created from integration test");
      expect(listed.length).toBe(1);
    })
  );
});
