import * as Schema from "effect/Schema";

export const ProductRow = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.NullOr(Schema.String),
  image_url: Schema.NullOr(Schema.String),
  price_cents: Schema.Int,
  is_active: Schema.Boolean,
  created_at: Schema.Date,
  updated_at: Schema.Date,
});
export type ProductRow = typeof ProductRow.Type;
