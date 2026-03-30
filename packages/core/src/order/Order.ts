import * as Schema from "effect/Schema";
import { CartId } from "../cart/CartId.js";
import { CustomerId } from "../customer/CustomerId.js";
import { ProductId } from "../product/ProductId.js";
import { CurrencyCode } from "../shared/values/CurrencyCode.js";
import { Email } from "../shared/values/Email.js";
import { OrderId } from "./OrderId.js";
import { OrderStatus } from "./OrderStatus.js";

const NonNegativeInt = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0));

export class Order extends Schema.Class<Order>("Order")({
  id: OrderId,
  displayId: Schema.NullOr(Schema.Int),
  // Legacy single-product fields (nullable for multi-item orders)
  productId: Schema.NullOr(ProductId),
  buyerName: Schema.String,
  buyerEmail: Email,
  pixKey: Schema.String,
  // Multi-item order fields
  customerId: Schema.NullOr(CustomerId),
  cartId: Schema.NullOr(CartId),
  subtotalCents: NonNegativeInt,
  shippingCents: NonNegativeInt,
  totalCents: NonNegativeInt,
  currency: CurrencyCode,
  metadata: Schema.Record(Schema.String, Schema.Unknown),
  status: OrderStatus,
  createdAt: Schema.Date,
  paidAt: Schema.NullOr(Schema.Date),
  cancelledAt: Schema.NullOr(Schema.Date),
}) {}
