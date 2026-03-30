import { useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { todosAtom } from "./atoms";
import { TodoItem } from "./todo-item";

export function TodoList() {
  const todos = useAtomValue(todosAtom);

  return AsyncResult.match(todos, {
    onInitial: () => (
      <div className="text-center py-8 text-gray-500">Loading...</div>
    ),
    onFailure: () => (
      <div className="text-center py-8 text-red-500">
        Failed to load todos. Is the API running?
      </div>
    ),
    onSuccess: (result) => (
      <ul className="space-y-2 mt-4">
        {result.value.length === 0 ? (
          <li className="text-center py-8 text-gray-400">
            No todos yet. Create one above!
          </li>
        ) : (
          result.value.map((todo) => <TodoItem key={todo.id} todo={todo} />)
        )}
      </ul>
    ),
  });
}
