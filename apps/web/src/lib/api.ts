import {
  type CreateTodoInputType,
  Todo,
  type TodoIdType,
  type UpdateTodoInputType,
} from "@starter/api-contract/TodoSchema";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { ApiClient } from "./api-client";

export class Api extends Context.Tag("@starter/web/lib/api")<
  Api,
  {
    readonly todos: {
      readonly list: () => Effect.Effect<ReadonlyArray<typeof Todo.Type>>;
      readonly create: (
        input: CreateTodoInputType
      ) => Effect.Effect<typeof Todo.Type>;
      readonly update: (
        id: TodoIdType,
        input: UpdateTodoInputType
      ) => Effect.Effect<typeof Todo.Type>;
      readonly remove: (id: TodoIdType) => Effect.Effect<void>;
    };
  }
>() {}

export const ApiLive = Layer.effect(
  Api,
  Effect.gen(function* () {
    const { http } = yield* ApiClient;

    return {
      todos: {
        list: () => Effect.orDie(http.todos.list()),
        create: (input: CreateTodoInputType) =>
          Effect.orDie(http.todos.create({ payload: input })),
        update: (id: TodoIdType, input: UpdateTodoInputType) =>
          Effect.orDie(http.todos.update({ path: { id }, payload: input })),
        remove: (id: TodoIdType) =>
          Effect.orDie(http.todos.remove({ path: { id } })),
      },
    } as const;
  })
);
