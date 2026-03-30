import * as Schema from "effect/Schema";
import { PaymentProvider } from "@starter/core/payment/PaymentProvider";
import { WebhookProcessingStatus } from "@starter/core/payment/WebhookProcessingStatus";

export const WebhookPayload = Schema.Struct({
  provider: PaymentProvider,
  eventId: Schema.String,
  eventType: Schema.String,
  payload: Schema.Record(Schema.String, Schema.Unknown),
});

export const WebhookResponse = Schema.Struct({
  status: Schema.String,
  processingStatus: WebhookProcessingStatus,
  isDuplicate: Schema.Boolean,
});

export class WebhookError extends Schema.TaggedErrorClass<WebhookError>()(
  "WebhookError",
  {
    message: Schema.String,
  },
  { httpApiStatus: 400 }
) {}
