import * as HttpApiEndpoint from "effect/unstable/httpapi/HttpApiEndpoint";
import * as HttpApiGroup from "effect/unstable/httpapi/HttpApiGroup";
import { OrderId } from "@starter/core/order/OrderId";
import * as Schema from "effect/Schema";
import {
  FulfillmentListResponse,
  FulfillmentNotFound,
  FulfillmentOperationError,
  FulfillmentResponse,
  ShipFulfillmentPayload,
} from "./FulfillmentSchema.js";

export class FulfillmentApiGroup extends HttpApiGroup.make("fulfillment")
  .add(
    HttpApiEndpoint.get(
      "getByOrderId",
      "/admin/fulfillments/:orderId",
      {
        params: { orderId: OrderId },
        success: FulfillmentListResponse,
      }
    )
  )
  .add(
    HttpApiEndpoint.post(
      "ship",
      "/admin/fulfillments/:fulfillmentId/ship",
      {
        params: { fulfillmentId: Schema.String },
        payload: ShipFulfillmentPayload,
        success: FulfillmentResponse,
        error: [FulfillmentNotFound, FulfillmentOperationError],
      }
    )
  )
  .add(
    HttpApiEndpoint.post(
      "cancel",
      "/admin/fulfillments/:fulfillmentId/cancel",
      {
        params: { fulfillmentId: Schema.String },
        success: FulfillmentResponse,
        error: [FulfillmentNotFound, FulfillmentOperationError],
      }
    )
  ) {}
