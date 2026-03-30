import * as Schema from "effect/Schema";
import { PaymentProvider } from "./PaymentProvider.js";
import { WebhookEventId } from "./WebhookEventId.js";
import { WebhookProcessingStatus } from "./WebhookProcessingStatus.js";

export class WebhookEvent extends Schema.Class<WebhookEvent>("WebhookEvent")({
  id: WebhookEventId,
  provider: PaymentProvider,
  eventId: Schema.String,
  eventType: Schema.String,
  payload: Schema.Record(Schema.String, Schema.Unknown),
  processingStatus: WebhookProcessingStatus,
  errorMessage: Schema.NullOr(Schema.String),
  attempts: Schema.Int,
  createdAt: Schema.Date,
  processedAt: Schema.NullOr(Schema.Date),
}) {}
