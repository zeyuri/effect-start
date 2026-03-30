import * as Schema from "effect/Schema";

export const OrderRow = Schema.Struct({
  id: Schema.String,
  display_id: Schema.NullOr(Schema.BigInt),
  product_id: Schema.NullOr(Schema.String),
  buyer_name: Schema.String,
  buyer_email: Schema.String,
  status: Schema.String,
  pix_key: Schema.String,
  customer_id: Schema.NullOr(Schema.String),
  cart_id: Schema.NullOr(Schema.String),
  subtotal_cents: Schema.BigInt,
  shipping_cents: Schema.BigInt,
  total_cents: Schema.BigInt,
  currency: Schema.String,
  metadata: Schema.Unknown,
  created_at: Schema.Date,
  paid_at: Schema.NullOr(Schema.Date),
  cancelled_at: Schema.NullOr(Schema.Date),
});
export type OrderRow = typeof OrderRow.Type;
