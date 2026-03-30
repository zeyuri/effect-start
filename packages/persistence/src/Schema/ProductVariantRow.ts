import * as Schema from "effect/Schema";

export const ProductVariantRow = Schema.Struct({
  id: Schema.String,
  product_id: Schema.String,
  name: Schema.String,
  sku: Schema.NullOr(Schema.String),
  price_cents: Schema.BigInt,
  currency: Schema.String,
  is_active: Schema.Boolean,
  is_digital: Schema.Boolean,
  stock: Schema.NullOr(Schema.Number),
  weight_grams: Schema.NullOr(Schema.Number),
  length_cm: Schema.NullOr(Schema.String),
  width_cm: Schema.NullOr(Schema.String),
  height_cm: Schema.NullOr(Schema.String),
  created_at: Schema.Date,
  updated_at: Schema.Date,
});
export type ProductVariantRow = typeof ProductVariantRow.Type;
