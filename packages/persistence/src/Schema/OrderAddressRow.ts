import * as Schema from "effect/Schema";

export const OrderAddressRow = Schema.Struct({
  id: Schema.String,
  order_id: Schema.String,
  type: Schema.String,
  full_name: Schema.String,
  line1: Schema.String,
  line2: Schema.NullOr(Schema.String),
  city: Schema.String,
  state: Schema.String,
  postal_code: Schema.String,
  country: Schema.String,
  phone: Schema.NullOr(Schema.String),
  created_at: Schema.Date,
});
export type OrderAddressRow = typeof OrderAddressRow.Type;
