import * as Schema from "effect/Schema";

export const WebhookEventId = Schema.String.pipe(
  Schema.brand("WebhookEventId")
);
export type WebhookEventId = typeof WebhookEventId.Type;
