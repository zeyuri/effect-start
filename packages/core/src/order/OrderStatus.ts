import * as Schema from "effect/Schema";

export const OrderStatus = Schema.Literals([
  "pending",
  "awaiting_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);
export type OrderStatus = typeof OrderStatus.Type;
