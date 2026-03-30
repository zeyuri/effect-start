import * as HttpApiEndpoint from "effect/unstable/httpapi/HttpApiEndpoint";
import * as HttpApiGroup from "effect/unstable/httpapi/HttpApiGroup";
import * as Schema from "effect/Schema";
import { ProductId } from "@starter/core/product/ProductId";
import { ProductVariantId } from "@starter/core/product/ProductVariantId";
import { OrderId } from "@starter/core/order/OrderId";
import { CustomerId } from "@starter/core/customer/CustomerId";
import { Customer } from "@starter/core/customer/Customer";
import { Product } from "@starter/core/product/Product";
import { Order } from "@starter/core/order/Order";
import {
  AdminCustomerNotFound,
  AdminOrderNotFound,
  AdminOrderOperationError,
  AdminProductNotFound,
  AdminVariantNotFound,
  AdminWebhookNotFound,
  AdminWebhookReplayError,
  CancelOrderPayload,
  DashboardStats,
  LowStockAlertListResponse,
  RefundOrderPayload,
  UpdateProductPayload,
  UpdateVariantPayload,
  WebhookEventListResponse,
  WebhookReplayResponse,
} from "./AdminSchema.js";
import { WebhookProcessingStatus } from "@starter/core/payment/WebhookProcessingStatus";

export class AdminApiGroup extends HttpApiGroup.make("admin")
  // --- Product Admin ---
  .add(
    HttpApiEndpoint.put("updateProduct", "/admin/products/:id", {
      params: { id: ProductId },
      payload: UpdateProductPayload,
      success: Product,
      error: AdminProductNotFound,
    })
  )
  .add(
    HttpApiEndpoint.delete("deleteProduct", "/admin/products/:id", {
      params: { id: ProductId },
      success: Schema.Struct({
        deleted: Schema.Boolean,
      }),
      error: AdminProductNotFound,
    })
  )
  .add(
    HttpApiEndpoint.put(
      "updateVariant",
      "/admin/products/:productId/variants/:variantId",
      {
        params: {
          productId: ProductId,
          variantId: ProductVariantId,
        },
        payload: UpdateVariantPayload,
        success: Product,
        error: [AdminProductNotFound, AdminVariantNotFound],
      }
    )
  )
  // --- Order Admin ---
  .add(
    HttpApiEndpoint.get("adminListOrders", "/admin/orders", {
      success: Schema.Array(Order),
    })
  )
  .add(
    HttpApiEndpoint.get("adminGetOrder", "/admin/orders/:id", {
      params: { id: OrderId },
      success: Order,
      error: AdminOrderNotFound,
    })
  )
  .add(
    HttpApiEndpoint.post("cancelOrder", "/admin/orders/:id/cancel", {
      params: { id: OrderId },
      payload: CancelOrderPayload,
      success: Order,
      error: [AdminOrderNotFound, AdminOrderOperationError],
    })
  )
  .add(
    HttpApiEndpoint.post("refundOrder", "/admin/orders/:id/refund", {
      params: { id: OrderId },
      payload: RefundOrderPayload,
      success: Order,
      error: [AdminOrderNotFound, AdminOrderOperationError],
    })
  )
  // --- Customer Admin ---
  .add(
    HttpApiEndpoint.get("listCustomers", "/admin/customers", {
      success: Schema.Array(Customer),
    })
  )
  .add(
    HttpApiEndpoint.get("getCustomer", "/admin/customers/:id", {
      params: { id: CustomerId },
      success: Customer,
      error: AdminCustomerNotFound,
    })
  )
  // --- Dashboard ---
  .add(
    HttpApiEndpoint.get("dashboardStats", "/admin/dashboard", {
      success: DashboardStats,
    })
  )
  // --- Inventory Alerts ---
  .add(
    HttpApiEndpoint.get("inventoryAlerts", "/admin/inventory-alerts", {
      query: {
        threshold: Schema.optional(Schema.NumberFromString),
      },
      success: LowStockAlertListResponse,
    })
  )
  // --- Webhook Admin ---
  .add(
    HttpApiEndpoint.get("listWebhookEvents", "/admin/webhooks", {
      query: {
        status: Schema.optional(WebhookProcessingStatus),
      },
      success: WebhookEventListResponse,
    })
  )
  .add(
    HttpApiEndpoint.get("getWebhookEvent", "/admin/webhooks/:id", {
      params: { id: Schema.String },
      success: Schema.Struct({
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
      }),
      error: AdminWebhookNotFound,
    })
  )
  .add(
    HttpApiEndpoint.post(
      "replayWebhookEvent",
      "/admin/webhooks/:id/replay",
      {
        params: { id: Schema.String },
        success: WebhookReplayResponse,
        error: [AdminWebhookNotFound, AdminWebhookReplayError],
      }
    )
  ) {}
