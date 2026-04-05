import { Api } from "~/lib/api";
import { AppLayer } from "~/lib/app-layer";
import { Todo } from "@starter/api-contract/TodoSchema";
import type { CreateTodoInput } from "@starter/api-contract/TodoSchema";
import type { TodoId } from "@starter/api-contract/TodoSchema";
import type { UpdateTodoInput } from "@starter/api-contract/TodoSchema";
import { serializable } from "~/lib/atom-utils";
import * as Atom from "effect/unstable/reactivity/Atom";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import * as Arr from "effect/Array";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";

const TodosSchema = Schema.Array(Todo);

export const runtime = Atom.runtime(AppLayer);

type TodosCacheUpdate = Data.TaggedEnum<{
  Upsert: { readonly todo: typeof Todo.Type };
  Delete: { readonly id: TodoId };
}>;

export const todosAtom = (() => {
  const rawAtom = runtime.atom(
    Effect.gen(function* () {
      const api = yield* Api;
      return yield* api.todos.list();
    })
  );
  const remoteAtom = pipe(
    rawAtom,
    serializable({
      key: "@starter/web/todos",
      schema: AsyncResult.Schema({
        success: TodosSchema,
      }),
    })
  );

  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      (ctx, update: TodosCacheUpdate) => {
        const current = ctx.get(todosAtom);
        if (!AsyncResult.isSuccess(current)) return;

        const nextValue = (() => {
          switch (update._tag) {
            case "Upsert": {
              const existingIndex = Arr.findFirstIndex(
                current.value,
                (t) => t.id === update.todo.id
              );
              return Option.match(existingIndex, {
                onNone: () => Arr.prepend(current.value, update.todo),
                onSome: (index) =>
                  Arr.replace(current.value, index, update.todo),
              });
            }
            case "Delete": {
              return Arr.filter(current.value, (t) => t.id !== update.id);
            }
          }
        })();

        ctx.setSelf(
          AsyncResult.success(nextValue) as Atom.Type<typeof remoteAtom>
        );
      },
      (refresh) => {
        refresh(remoteAtom);
      }
    ),
    { remote: remoteAtom }
  );
})();

const createTodoFn = runtime.fn<CreateTodoInput>();
export const createTodoAtom = createTodoFn(
  Effect.fnUntraced(function* (input, get) {
    const api = yield* Api;
    const result = yield* api.todos.create(input);
    get.set(todosAtom, { _tag: "Upsert", todo: result });
    return result;
  })
);

const updateTodoFn = runtime.fn<{
  readonly id: TodoId;
  readonly input: UpdateTodoInput;
}>();
export const updateTodoAtom = updateTodoFn(
  Effect.fnUntraced(function* ({ id, input }, get) {
    const api = yield* Api;
    const result = yield* api.todos.update(id, input);
    get.set(todosAtom, { _tag: "Upsert", todo: result });
    return result;
  })
);

const deleteTodoFn = runtime.fn<TodoId>();
export const deleteTodoAtom = deleteTodoFn(
  Effect.fnUntraced(function* (id, get) {
    const api = yield* Api;
    yield* api.todos.remove(id);
    get.set(todosAtom, { _tag: "Delete", id });
  })
);
