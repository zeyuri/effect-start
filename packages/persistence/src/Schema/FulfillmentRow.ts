import * as Schema from "effect/Schema";

export const FulfillmentRow = Schema.Struct({
  id: Schema.String,
  order_id: Schema.String,
  type: Schema.String,
  status: Schema.String,
  provider: Schema.NullOr(Schema.String),
  tracking_code: Schema.NullOr(Schema.String),
  shipped_at: Schema.NullOr(Schema.Date),
  delivered_at: Schema.NullOr(Schema.Date),
  cancelled_at: Schema.NullOr(Schema.Date),
  metadata: Schema.Unknown,
  created_at: Schema.Date,
  updated_at: Schema.Date,
});

export type FulfillmentRow = typeof FulfillmentRow.Type;
