import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { HydrationBoundary } from "@effect/atom-react/ReactHydration";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { dehydrate } from "~/lib/atom-utils";
import { Api } from "~/lib/api";
import { serverRuntime } from "~/lib/server-runtime";
import { todosAtom } from "./-lib/atoms";
import { TodoList } from "./-lib/todo-list";
import { CreateTodoForm } from "./-lib/create-todo-form";

const listTodos = createServerFn({ method: "GET" }).handler(async () => {
  const exit = await serverRuntime.runPromiseExit(
    Api.use((api) => api.todos.list())
  );
  return dehydrate(todosAtom.remote, AsyncResult.fromExit(exit));
});

export const Route = createFileRoute("/todos/")({
  loader: () => listTodos(),
  component: TodosPage,
});

function TodosPage() {
  const dehydrated = Route.useLoaderData();

  return (
    <HydrationBoundary state={[dehydrated]}>
      <TodosContent />
    </HydrationBoundary>
  );
}

function TodosContent() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Todos</h1>
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
          Back to Home
        </Link>
      </div>
      <CreateTodoForm />
      <TodoList />
    </div>
  );
}
