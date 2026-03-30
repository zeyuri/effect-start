import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Schema from "effect/Schema";
import { Todo } from "@starter/api-contract/TodoSchema";
import type {
  CreateTodoInputType,
  TodoIdType,
  UpdateTodoInputType,
} from "@starter/api-contract/TodoSchema";
import { atomRuntime, AdminApiClient } from "~/lib/runtime";
import { serializable } from "~/lib/atom-utils";

const TodosSchema = Schema.Array(Todo);

const loadTodos = Effect.gen(function* () {
  const { http } = yield* AdminApiClient;
  return yield* Effect.orDie(http.todos.list());
});

const todosRemoteAtom = atomRuntime.atom(loadTodos);

export const todosQuery = pipe(
  todosRemoteAtom,
  serializable({
    key: "@starter/admin/todos",
    schema: AsyncResult.Schema({ success: TodosSchema }),
  })
);

export const createTodoMutation = atomRuntime.fn<{
  readonly payload: CreateTodoInputType;
}>()(
  Effect.fnUntraced(function* ({ payload }) {
    const { http } = yield* AdminApiClient;
    return yield* Effect.orDie(http.todos.create({ payload }));
  })
);

export const updateTodoMutation = atomRuntime.fn<{
  readonly params: { readonly id: TodoIdType };
  readonly payload: UpdateTodoInputType;
}>()(
  Effect.fnUntraced(function* ({ params, payload }) {
    const { http } = yield* AdminApiClient;
    return yield* Effect.orDie(http.todos.update({ params, payload }));
  })
);

export const removeTodoMutation = atomRuntime.fn<{
  readonly params: { readonly id: TodoIdType };
}>()(
  Effect.fnUntraced(function* ({ params }) {
    const { http } = yield* AdminApiClient;
    yield* Effect.orDie(http.todos.remove({ params }));
  })
);
