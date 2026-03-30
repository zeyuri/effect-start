import * as Schema from "effect/Schema";

export const CurrencyCode = Schema.String.check(
  Schema.isPattern(/^[A-Z]{3}$/)
).pipe(Schema.brand("CurrencyCode"));
export type CurrencyCode = typeof CurrencyCode.Type;
