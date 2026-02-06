import { pipe } from "effect/Function";
import * as Schema from "effect/Schema";

export const CreateTodoInput = Schema.Struct({
  title: pipe(Schema.String, Schema.minLength(1)),
});
export type CreateTodoInput = typeof CreateTodoInput.Type;
