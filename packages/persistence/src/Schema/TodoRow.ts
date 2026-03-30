import * as Schema from "effect/Schema";

export const TodoRow = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  completed: Schema.Boolean,
  created_at: Schema.Date,
});
export type TodoRow = typeof TodoRow.Type;
