import * as Schema from "effect/Schema";

export const Email = Schema.String.check(
  Schema.isPattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
).pipe(Schema.brand("Email"));
export type Email = typeof Email.Type;
