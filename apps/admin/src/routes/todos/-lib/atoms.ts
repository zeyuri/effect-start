import { AdminApi } from "~/lib/runtime";

export const todosQuery = AdminApi.query("todos", "list", {});

export const createTodoMutation = AdminApi.mutation("todos", "create");

export const updateTodoMutation = AdminApi.mutation("todos", "update");

export const removeTodoMutation = AdminApi.mutation("todos", "remove");
