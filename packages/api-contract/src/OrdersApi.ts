import * as HttpApiEndpoint from "effect/unstable/httpapi/HttpApiEndpoint";
import * as HttpApiGroup from "effect/unstable/httpapi/HttpApiGroup";
import {
  CreateOrderPayload,
  CreateOrderFromCartPayload,
  Order,
  OrderId,
  OrderNotFound,
  OrderList,
  DownloadUrlResponse,
  ConfirmationSent,
  OrderNotPaid,
  DigitalProductNotFound,
  Email,
} from "./OrderSchema.js";
import { InsufficientStock } from "./CartSchema.js";

export class OrdersApiGroup extends HttpApiGroup.make("orders")
  .add(
    HttpApiEndpoint.post("create", "/orders", {
      payload: CreateOrderPayload,
      success: Order.annotate({ httpApiStatus: 201 }),
    })
  )
  .add(
    HttpApiEndpoint.post("createFromCart", "/orders/from-cart", {
      payload: CreateOrderFromCartPayload,
      success: Order.annotate({ httpApiStatus: 201 }),
      error: InsufficientStock,
    })
  )
  .add(
    HttpApiEndpoint.get("getById", "/orders/:id", {
      params: { id: OrderId },
      success: Order,
      error: OrderNotFound,
    })
  )
  .add(
    HttpApiEndpoint.get("listOrders", "/orders", {
      success: OrderList,
    })
  )
  .add(
    HttpApiEndpoint.get("listOrdersByEmail", "/orders/by-email/:email", {
      params: { email: Email },
      success: OrderList,
    })
  )
  .add(
    HttpApiEndpoint.get("getDownload", "/orders/:id/download", {
      params: { id: OrderId },
      success: DownloadUrlResponse,
      error: [OrderNotFound, OrderNotPaid, DigitalProductNotFound],
    })
  )
  .add(
    HttpApiEndpoint.post("sendConfirmation", "/orders/:id/send-confirmation", {
      params: { id: OrderId },
      success: ConfirmationSent,
      error: OrderNotFound,
    })
  ) {}
