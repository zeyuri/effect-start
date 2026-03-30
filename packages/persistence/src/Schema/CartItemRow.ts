import * as Schema from "effect/Schema";

export const CartItemRow = Schema.Struct({
  id: Schema.String,
  cart_id: Schema.String,
  product_variant_id: Schema.String,
  quantity: Schema.Number,
  unit_price_cents: Schema.BigInt,
  created_at: Schema.Date,
});
export type CartItemRow = typeof CartItemRow.Type;
