import * as Schema from "effect/Schema";
import { OrderId } from "@starter/core/order/OrderId";

export { OrderId } from "@starter/core/order/OrderId";

export const FulfillmentType = Schema.Literals(["physical", "digital"]);

export const FulfillmentStatus = Schema.Literals([
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "failed",
]);

export const FulfillmentResponse = Schema.Struct({
  id: Schema.String,
  orderId: OrderId,
  type: FulfillmentType,
  status: FulfillmentStatus,
  provider: Schema.NullOr(Schema.String),
  trackingCode: Schema.NullOr(Schema.String),
  shippedAt: Schema.NullOr(Schema.Date),
  deliveredAt: Schema.NullOr(Schema.Date),
  cancelledAt: Schema.NullOr(Schema.Date),
  metadata: Schema.Record(Schema.String, Schema.Unknown),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
});

export const FulfillmentListResponse = Schema.Array(FulfillmentResponse);

export const ShipFulfillmentPayload = Schema.Struct({
  provider: Schema.String,
  trackingCode: Schema.String,
});

export class FulfillmentNotFound extends Schema.TaggedErrorClass<FulfillmentNotFound>()(
  "FulfillmentNotFound",
  {
    id: Schema.String,
  },
  { httpApiStatus: 404 }
) {}

export class FulfillmentOperationError extends Schema.TaggedErrorClass<FulfillmentOperationError>()(
  "FulfillmentOperationError",
  {
    message: Schema.String,
  },
  { httpApiStatus: 400 }
) {}
