import * as Schema from "effect/Schema";

export const CustomerRow = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  name: Schema.String,
  default_address_id: Schema.NullOr(Schema.String),
  created_at: Schema.Date,
  updated_at: Schema.Date,
});
export type CustomerRow = typeof CustomerRow.Type;
