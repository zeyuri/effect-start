import * as HttpApi from "effect/unstable/httpapi/HttpApi";
import { AdminApiGroup } from "./AdminApi.js";
import { CartsApiGroup } from "./CartsApi.js";
import { CheckoutApiGroup } from "./CheckoutApi.js";
import { FulfillmentApiGroup } from "./FulfillmentApi.js";
import { OrdersApiGroup } from "./OrdersApi.js";
import { ProductsApiGroup } from "./ProductsApi.js";
import { ShippingApiGroup } from "./Definitions/ShippingApi.js";
import { TodosApiGroup } from "./TodosApi.js";
import { WebhooksApiGroup } from "./WebhooksApi.js";

export class AppApi extends HttpApi.make("app")
  .add(TodosApiGroup)
  .add(ProductsApiGroup)
  .add(OrdersApiGroup)
  .add(CartsApiGroup)
  .add(CheckoutApiGroup)
  .add(WebhooksApiGroup)
  .add(ShippingApiGroup)
  .add(FulfillmentApiGroup)
  .add(AdminApiGroup)
  .prefix("/api") {}
