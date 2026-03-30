import * as Schema from "effect/Schema";

export const PaymentProvider = Schema.Literals(["stripe", "woovi"]);
export type PaymentProvider = typeof PaymentProvider.Type;
