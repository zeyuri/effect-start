import * as Schema from "effect/Schema";

export const CreateTodoInput = Schema.Struct({
  title: Schema.String.check(Schema.isMinLength(1)),
});
export type CreateTodoInput = typeof CreateTodoInput.Type;
