import * as Schema from "effect/Schema";
import { ProductId } from "@starter/core/product/ProductId";
import { ProductVariantId } from "@starter/core/product/ProductVariantId";
import { OrderId } from "@starter/core/order/OrderId";
import { CustomerId } from "@starter/core/customer/CustomerId";

export { CustomerId } from "@starter/core/customer/CustomerId";
export type { CustomerId as CustomerIdType } from "@starter/core/customer/CustomerId";
export { Customer } from "@starter/core/customer/Customer";

// --- Product Admin ---

export const UpdateProductPayload = Schema.Struct({
  name: Schema.optionalKey(Schema.String),
  description: Schema.optionalKey(Schema.String),
  imageUrl: Schema.optionalKey(Schema.String),
  priceCents: Schema.optionalKey(Schema.Int),
});

export const UpdateVariantPayload = Schema.Struct({
  name: Schema.optionalKey(Schema.String),
  priceCents: Schema.optionalKey(
    Schema.Int.check(Schema.isGreaterThanOrEqualTo(0))
  ),
  stock: Schema.optionalKey(
    Schema.NullOr(Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)))
  ),
  weightGrams: Schema.optionalKey(Schema.NullOr(Schema.Number)),
  lengthCm: Schema.optionalKey(Schema.NullOr(Schema.String)),
  widthCm: Schema.optionalKey(Schema.NullOr(Schema.String)),
  heightCm: Schema.optionalKey(Schema.NullOr(Schema.String)),
});

export class AdminProductNotFound extends Schema.TaggedErrorClass<AdminProductNotFound>()(
  "AdminProductNotFound",
  {
    id: ProductId,
  },
  { httpApiStatus: 404 }
) {}

export class AdminVariantNotFound extends Schema.TaggedErrorClass<AdminVariantNotFound>()(
  "AdminVariantNotFound",
  {
    id: ProductVariantId,
  },
  { httpApiStatus: 404 }
) {}

// --- Order Admin ---

export const CancelOrderPayload = Schema.Struct({
  reason: Schema.optional(Schema.String),
});

export const RefundOrderPayload = Schema.Struct({
  reason: Schema.optional(Schema.String),
});

export class AdminOrderNotFound extends Schema.TaggedErrorClass<AdminOrderNotFound>()(
  "AdminOrderNotFound",
  {
    id: OrderId,
  },
  { httpApiStatus: 404 }
) {}

export class AdminOrderOperationError extends Schema.TaggedErrorClass<AdminOrderOperationError>()(
  "AdminOrderOperationError",
  {
    message: Schema.String,
  },
  { httpApiStatus: 400 }
) {}

// --- Customer Admin ---

export class AdminCustomerNotFound extends Schema.TaggedErrorClass<AdminCustomerNotFound>()(
  "AdminCustomerNotFound",
  {
    id: CustomerId,
  },
  { httpApiStatus: 404 }
) {}

// --- Webhook Admin ---

export const WebhookEventResponse = Schema.Struct({
  id: Schema.String,
  provider: Schema.String,
  eventId: Schema.String,
  eventType: Schema.String,
  payload: Schema.Record(Schema.String, Schema.Unknown),
  processingStatus: Schema.String,
  errorMessage: Schema.NullOr(Schema.String),
  attempts: Schema.Number,
  createdAt: Schema.String,
  processedAt: Schema.NullOr(Schema.String),
});

export const WebhookEventListResponse = Schema.Array(WebhookEventResponse);

export const WebhookReplayResponse = Schema.Struct({
  id: Schema.String,
  processingStatus: Schema.String,
  attempts: Schema.Number,
  replayed: Schema.Boolean,
});

export class AdminWebhookNotFound extends Schema.TaggedErrorClass<AdminWebhookNotFound>()(
  "AdminWebhookNotFound",
  {
    id: Schema.String,
  },
  { httpApiStatus: 404 }
) {}

export class AdminWebhookReplayError extends Schema.TaggedErrorClass<AdminWebhookReplayError>()(
  "AdminWebhookReplayError",
  {
    message: Schema.String,
  },
  { httpApiStatus: 400 }
) {}

// --- Inventory Alerts ---

export const LowStockAlertResponse = Schema.Struct({
  variantId: Schema.String,
  productId: Schema.String,
  variantName: Schema.String,
  stock: Schema.Number,
  alertedAt: Schema.String,
});

export const LowStockAlertListResponse = Schema.Array(LowStockAlertResponse);

// --- Dashboard Stats ---

export const StatusCount = Schema.Struct({
  status: Schema.String,
  count: Schema.Number,
});

export const DashboardStats = Schema.Struct({
  totalOrders: Schema.Number,
  totalRevenueCents: Schema.Number,
  ordersByStatus: Schema.Array(StatusCount),
  totalCustomers: Schema.Number,
  totalProducts: Schema.Number,
});
