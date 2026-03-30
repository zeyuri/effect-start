import * as Schema from "effect/Schema";

export const WebhookEventRow = Schema.Struct({
  id: Schema.String,
  provider: Schema.String,
  event_id: Schema.String,
  event_type: Schema.String,
  payload: Schema.Unknown,
  processing_status: Schema.String,
  error_message: Schema.NullOr(Schema.String),
  attempts: Schema.Number,
  created_at: Schema.Date,
  processed_at: Schema.NullOr(Schema.Date),
});
export type WebhookEventRow = typeof WebhookEventRow.Type;
