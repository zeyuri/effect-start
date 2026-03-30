import * as Schema from "effect/Schema";

export const PaymentId = Schema.String.pipe(Schema.brand("PaymentId"));
export type PaymentId = typeof PaymentId.Type;
