import * as Schema from "effect/Schema";

export const OrderItemRow = Schema.Struct({
  id: Schema.String,
  order_id: Schema.String,
  product_variant_id: Schema.String,
  product_name: Schema.String,
  variant_name: Schema.String,
  sku: Schema.NullOr(Schema.String),
  quantity: Schema.Number,
  unit_price_cents: Schema.BigInt,
  is_digital: Schema.Boolean,
  created_at: Schema.Date,
});
export type OrderItemRow = typeof OrderItemRow.Type;
