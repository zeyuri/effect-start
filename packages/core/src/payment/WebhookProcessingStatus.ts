import * as Schema from "effect/Schema";

export const WebhookProcessingStatus = Schema.Literals([
  "pending",
  "processing",
  "completed",
  "failed",
]);
export type WebhookProcessingStatus = typeof WebhookProcessingStatus.Type;
