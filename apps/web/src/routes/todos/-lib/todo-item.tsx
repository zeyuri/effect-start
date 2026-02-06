import { useAtomSet } from "@effect-atom/atom-react";
import * as Option from "effect/Option";
import type { Todo } from "@starter/api-contract/TodoSchema";
import { updateTodoAtom, deleteTodoAtom } from "./atoms";

export function TodoItem({ todo }: { readonly todo: typeof Todo.Type }) {
  const updateTodo = useAtomSet(updateTodoAtom);
  const deleteTodo = useAtomSet(deleteTodoAtom);

  const toggleCompleted = () => {
    updateTodo({
      id: todo.id,
      input: {
        title: Option.none(),
        completed: Option.some(!todo.completed),
      },
    });
  };

  const handleDelete = () => {
    deleteTodo(todo.id);
  };

  return (
    <li className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={toggleCompleted}
        className="w-5 h-5 rounded border-gray-300"
      />
      <span
        className={`flex-1 ${todo.completed ? "line-through text-gray-400" : "text-gray-800"}`}
      >
        {todo.title}
      </span>
      <button
        onClick={handleDelete}
        className="text-red-500 hover:text-red-700 text-sm"
      >
        Delete
      </button>
    </li>
  );
}
