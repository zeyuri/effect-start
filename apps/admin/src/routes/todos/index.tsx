import { createFileRoute } from "@tanstack/react-router";
import type { TodoIdType } from "@starter/api-contract/TodoSchema";
import {
  useAtomRefresh,
  useAtomSet,
  useAtomValue,
} from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import * as Exit from "effect/Exit";
import * as Option from "effect/Option";
import { useState } from "react";
import {
  createTodoMutation,
  removeTodoMutation,
  todosQuery,
  updateTodoMutation,
} from "./-lib/atoms";

export const Route = createFileRoute("/todos/")({
  component: TodosPage,
});

function TodosPage() {
  const todos = useAtomValue(todosQuery);
  const refreshTodos = useAtomRefresh(todosQuery);
  const createTodo = useAtomSet(createTodoMutation, { mode: "promiseExit" });
  const updateTodo = useAtomSet(updateTodoMutation, { mode: "promiseExit" });
  const removeTodo = useAtomSet(removeTodoMutation, { mode: "promiseExit" });

  const [title, setTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedTitle = title.trim();
    if (normalizedTitle.length === 0) {
      return;
    }

    const exit = await createTodo({
      payload: { title: normalizedTitle },
    });

    if (Exit.isFailure(exit)) {
      setErrorMessage("Failed to create todo.");
      return;
    }

    setTitle("");
    setErrorMessage(null);
    refreshTodos();
  };

  const handleToggle = async (id: TodoIdType, completed: boolean) => {
    const exit = await updateTodo({
      params: { id },
      payload: {
        title: Option.none(),
        completed: Option.some(!completed),
      },
    });

    if (Exit.isFailure(exit)) {
      setErrorMessage("Failed to update todo.");
      return;
    }

    setErrorMessage(null);
    refreshTodos();
  };

  const handleDelete = async (id: TodoIdType) => {
    const exit = await removeTodo({ params: { id } });

    if (Exit.isFailure(exit)) {
      setErrorMessage("Failed to delete todo.");
      return;
    }

    setErrorMessage(null);
    refreshTodos();
  };

  return (
    <div>
      <h1
        style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}
      >
        Todos
      </h1>
      <form
        onSubmit={(event) => {
          handleCreate(event).catch(() => {
            setErrorMessage("Failed to create todo.");
          });
        }}
        style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}
      >
        <input
          type="text"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
          }}
          placeholder="New todo title"
          style={{ flex: 1, padding: "0.5rem" }}
        />
        <button
          type="submit"
          style={{ padding: "0.5rem 0.75rem" }}
          disabled={title.trim().length === 0}
        >
          Create
        </button>
      </form>
      {errorMessage !== null ? (
        <p style={{ color: "#b91c1c", marginBottom: "0.75rem" }}>
          {errorMessage}
        </p>
      ) : null}
      {AsyncResult.match(todos, {
        onInitial: () => <p>Loading todos...</p>,
        onFailure: () => <p>Failed to load todos.</p>,
        onSuccess: (success) => (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Title</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Status</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>
                  Created
                </th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {success.value.map((todo) => (
                <tr key={todo.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "0.5rem" }}>{todo.title}</td>
                  <td style={{ padding: "0.5rem" }}>
                    {todo.completed ? "Done" : "Pending"}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    {String(todo.createdAt)}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={() => {
                          handleToggle(todo.id, todo.completed).catch(() => {
                            setErrorMessage("Failed to update todo.");
                          });
                        }}
                        style={{ padding: "0.25rem 0.5rem" }}
                      >
                        {todo.completed ? "Reopen" : "Complete"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDelete(todo.id).catch(() => {
                            setErrorMessage("Failed to delete todo.");
                          });
                        }}
                        style={{ padding: "0.25rem 0.5rem" }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ),
      })}
    </div>
  );
}
