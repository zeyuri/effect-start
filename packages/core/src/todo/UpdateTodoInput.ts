import * as Schema from "effect/Schema";

export const UpdateTodoInput = Schema.Struct({
  title: Schema.optionalKey(
    Schema.OptionFromUndefinedOr(Schema.String.check(Schema.isMinLength(1)))
  ),
  completed: Schema.optionalKey(Schema.OptionFromUndefinedOr(Schema.Boolean)),
});
export type UpdateTodoInput = typeof UpdateTodoInput.Type;
