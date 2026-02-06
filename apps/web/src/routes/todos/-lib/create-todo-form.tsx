import { useAtomSet } from "@effect-atom/atom-react";
import { useState } from "react";
import { createTodoAtom } from "./atoms";

export function CreateTodoForm() {
  const [title, setTitle] = useState("");
  const createTodo = useAtomSet(createTodoAtom);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length === 0) return;
    createTodo({ title: title.trim() });
    setTitle("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        disabled={title.trim().length === 0}
      >
        Add
      </button>
    </form>
  );
}
