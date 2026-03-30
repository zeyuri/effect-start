import * as Schema from "effect/Schema";

export const PaymentStatus = Schema.Literals([
  "pending",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
  "refunded",
]);
export type PaymentStatus = typeof PaymentStatus.Type;
