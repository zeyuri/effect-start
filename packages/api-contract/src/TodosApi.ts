import * as HttpApiEndpoint from "@effect/platform/HttpApiEndpoint";
import * as HttpApiGroup from "@effect/platform/HttpApiGroup";
import * as Schema from "effect/Schema";
import {
  CreateTodoInput,
  Todo,
  TodoId,
  TodoNotFoundError,
  UpdateTodoInput,
} from "./TodoSchema.js";

export class TodosApiGroup extends HttpApiGroup.make("todos")
  .add(HttpApiEndpoint.get("list", "/todos").addSuccess(Schema.Array(Todo)))
  .add(
    HttpApiEndpoint.get("getById", "/todos/:id")
      .setPath(Schema.Struct({ id: TodoId }))
      .addSuccess(Todo)
      .addError(TodoNotFoundError)
  )
  .add(
    HttpApiEndpoint.post("create", "/todos")
      .setPayload(CreateTodoInput)
      .addSuccess(Todo, { status: 201 })
  )
  .add(
    HttpApiEndpoint.patch("update", "/todos/:id")
      .setPath(Schema.Struct({ id: TodoId }))
      .setPayload(UpdateTodoInput)
      .addSuccess(Todo)
      .addError(TodoNotFoundError)
  )
  .add(
    HttpApiEndpoint.del("remove", "/todos/:id")
      .setPath(Schema.Struct({ id: TodoId }))
      .addSuccess(Schema.Void)
      .addError(TodoNotFoundError)
  ) {}
