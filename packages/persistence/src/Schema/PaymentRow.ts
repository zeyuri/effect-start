import * as Schema from "effect/Schema";

export const PaymentRow = Schema.Struct({
  id: Schema.String,
  order_id: Schema.String,
  provider: Schema.String,
  provider_id: Schema.NullOr(Schema.String),
  idempotency_key: Schema.String,
  status: Schema.String,
  amount_cents: Schema.BigInt,
  currency: Schema.String,
  provider_data: Schema.Unknown,
  error_message: Schema.NullOr(Schema.String),
  created_at: Schema.Date,
  updated_at: Schema.Date,
});
export type PaymentRow = typeof PaymentRow.Type;
