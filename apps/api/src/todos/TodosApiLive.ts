import { AppApi } from "@starter/api-contract/AppApi";
import {
  type CreateTodoInputType,
  type TodoIdType,
  TodoNotFoundError,
  type UpdateTodoInputType,
} from "@starter/api-contract/TodoSchema";
import { TodoRepository } from "@starter/persistence/Services/TodoRepository";
import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";

export const listTodos = () =>
  Effect.gen(function* () {
    const repo = yield* TodoRepository;
    const todos = yield* Effect.orDie(repo.list());
    return [...todos];
  });

export const getTodoById = (id: TodoIdType) =>
  Effect.gen(function* () {
    const repo = yield* TodoRepository;
    const effect = repo.getById(id);
    return yield* pipe(
      effect,
      Effect.catchTag("PersistenceError", Effect.die),
      Effect.mapError(() => new TodoNotFoundError({ id }))
    );
  });

export const createTodo = (input: CreateTodoInputType) =>
  Effect.gen(function* () {
    const repo = yield* TodoRepository;
    return yield* Effect.orDie(repo.create(input));
  });

export const updateTodo = (id: TodoIdType, input: UpdateTodoInputType) =>
  Effect.gen(function* () {
    const repo = yield* TodoRepository;
    const effect = repo.update(id, input);
    return yield* pipe(
      effect,
      Effect.catchTag("PersistenceError", Effect.die),
      Effect.mapError(() => new TodoNotFoundError({ id }))
    );
  });

export const removeTodo = (id: TodoIdType) =>
  Effect.gen(function* () {
    const repo = yield* TodoRepository;
    const effect = repo.remove(id);
    yield* pipe(
      effect,
      Effect.catchTag("PersistenceError", Effect.die),
      Effect.mapError(() => new TodoNotFoundError({ id }))
    );
  });

export const TodosApiLive = HttpApiBuilder.group(AppApi, "todos", (handlers) =>
  handlers
    .handle("list", listTodos)
    .handle("getById", ({ path }) => getTodoById(path.id))
    .handle("create", ({ payload }) => createTodo(payload))
    .handle("update", ({ path, payload }) => updateTodo(path.id, payload))
    .handle("remove", ({ path }) => removeTodo(path.id))
);
