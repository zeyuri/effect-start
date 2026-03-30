import * as Schema from "effect/Schema";

export const CartRow = Schema.Struct({
  id: Schema.String,
  customer_id: Schema.NullOr(Schema.String),
  email: Schema.NullOr(Schema.String),
  status: Schema.String,
  metadata: Schema.Unknown,
  created_at: Schema.Date,
  updated_at: Schema.Date,
});
export type CartRow = typeof CartRow.Type;
