import { pipe } from "effect/Function";
import * as Schema from "effect/Schema";

export const UpdateTodoInput = Schema.Struct({
  title: Schema.optionalWith(pipe(Schema.String, Schema.minLength(1)), {
    as: "Option",
  }),
  completed: Schema.optionalWith(Schema.Boolean, { as: "Option" }),
});
export type UpdateTodoInput = typeof UpdateTodoInput.Type;
