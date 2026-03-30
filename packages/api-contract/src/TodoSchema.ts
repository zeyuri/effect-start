import * as Schema from "effect/Schema";
import { TodoId } from "@starter/core/todo/TodoId";

export { Todo } from "@starter/core/todo/Todo";
export { TodoId };
export type { TodoId as TodoIdType } from "@starter/core/todo/TodoId";
export { CreateTodoInput } from "@starter/core/todo/CreateTodoInput";
export type { CreateTodoInput as CreateTodoInputType } from "@starter/core/todo/CreateTodoInput";
export { UpdateTodoInput } from "@starter/core/todo/UpdateTodoInput";
export type { UpdateTodoInput as UpdateTodoInputType } from "@starter/core/todo/UpdateTodoInput";

export class TodoNotFoundError extends Schema.TaggedErrorClass<TodoNotFoundError>()(
  "TodoNotFoundError",
  {
    id: TodoId,
  },
  { httpApiStatus: 404 }
) {}
