import * as HttpApiEndpoint from "effect/unstable/httpapi/HttpApiEndpoint";
import * as HttpApiGroup from "effect/unstable/httpapi/HttpApiGroup";
import {
  WebhookError,
  WebhookPayload,
  WebhookResponse,
} from "./WebhookSchema.js";

export class WebhooksApiGroup extends HttpApiGroup.make("webhooks").add(
  HttpApiEndpoint.post("ingest", "/webhooks/ingest", {
    payload: WebhookPayload,
    success: WebhookResponse,
    error: WebhookError,
  })
) {}
