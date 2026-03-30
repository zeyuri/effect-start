import * as HttpApiEndpoint from "effect/unstable/httpapi/HttpApiEndpoint";
import * as HttpApiGroup from "effect/unstable/httpapi/HttpApiGroup";
import * as Schema from "effect/Schema";
import {
  CreateTodoInput,
  Todo,
  TodoId,
  TodoNotFoundError,
  UpdateTodoInput,
} from "./TodoSchema.js";

export class TodosApiGroup extends HttpApiGroup.make("todos")
  .add(
    HttpApiEndpoint.get("list", "/todos", {
      success: Schema.Array(Todo),
    })
  )
  .add(
    HttpApiEndpoint.get("getById", "/todos/:id", {
      params: { id: TodoId },
      success: Todo,
      error: TodoNotFoundError,
    })
  )
  .add(
    HttpApiEndpoint.post("create", "/todos", {
      payload: CreateTodoInput,
      success: Todo.annotate({ httpApiStatus: 201 }),
    })
  )
  .add(
    HttpApiEndpoint.patch("update", "/todos/:id", {
      params: { id: TodoId },
      payload: UpdateTodoInput,
      success: Todo,
      error: TodoNotFoundError,
    })
  )
  .add(
    HttpApiEndpoint.delete("remove", "/todos/:id", {
      params: { id: TodoId },
      error: TodoNotFoundError,
    })
  ) {}
