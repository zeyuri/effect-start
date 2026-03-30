import * as Schema from "effect/Schema";

export const ShippingQuoteRow = Schema.Struct({
  id: Schema.String,
  order_id: Schema.String,
  carrier: Schema.String,
  service: Schema.String,
  price_cents: Schema.BigInt,
  currency: Schema.String,
  estimated_days: Schema.NullOr(Schema.Number),
  status: Schema.String,
  expires_at: Schema.NullOr(Schema.Date),
  selected_at: Schema.NullOr(Schema.Date),
  metadata: Schema.Unknown,
  created_at: Schema.Date,
});

export type ShippingQuoteRow = typeof ShippingQuoteRow.Type;
