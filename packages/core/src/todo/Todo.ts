import * as Schema from "effect/Schema";
import { TodoId } from "./TodoId.js";

export class Todo extends Schema.Class<Todo>("Todo")({
  id: TodoId,
  title: Schema.String,
  completed: Schema.Boolean,
  createdAt: Schema.DateTimeUtc,
}) {}
