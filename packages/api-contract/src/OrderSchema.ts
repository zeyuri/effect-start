import * as Schema from "effect/Schema";
import * as SchemaGetter from "effect/SchemaGetter";
import { ProductId } from "@starter/core/product/ProductId";
import { OrderId } from "@starter/core/order/OrderId";
import { Email } from "@starter/core/shared/values/Email";
import { CartId } from "@starter/core/cart/CartId";
import { CustomerId } from "@starter/core/customer/CustomerId";
import { CurrencyCode } from "@starter/core/shared/values/CurrencyCode";
import { OrderAddressType } from "@starter/core/order/OrderAddressType";
import { Order } from "@starter/core/order/Order";

export { Order } from "@starter/core/order/Order";
export { OrderId } from "@starter/core/order/OrderId";
export type { OrderId as OrderIdType } from "@starter/core/order/OrderId";
export { OrderStatus } from "@starter/core/order/OrderStatus";
export { OrderAddress } from "@starter/core/order/OrderAddress";
export { OrderAddressId } from "@starter/core/order/OrderAddressId";
export type { OrderAddressId as OrderAddressIdType } from "@starter/core/order/OrderAddressId";
export { OrderItem } from "@starter/core/order/OrderItem";
export { OrderItemId } from "@starter/core/order/OrderItemId";
export { Email } from "@starter/core/shared/values/Email";
export { DownloadTokenId } from "@starter/core/shared/values/DownloadTokenId";

/** Legacy single-product order creation */
export const CreateOrderPayload = Schema.Struct({
  productId: ProductId,
  buyerName: Schema.String,
  buyerEmail: Email,
});

const NonNegativeInt = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0));

/** Address snapshot embedded in cart-based order creation */
export const AddressSnapshot = Schema.Struct({
  type: OrderAddressType,
  fullName: Schema.String,
  line1: Schema.String,
  line2: Schema.NullOr(Schema.String),
  city: Schema.String,
  state: Schema.String,
  postalCode: Schema.String,
  country: Schema.optional(Schema.String).pipe(
    Schema.decodeTo(Schema.toType(Schema.String), {
      decode: SchemaGetter.withDefault(() => "BR"),
      encode: SchemaGetter.required(),
    })
  ),
  phone: Schema.NullOr(Schema.String),
});

/** Cart-based multi-item order creation */
export const CreateOrderFromCartPayload = Schema.Struct({
  cartId: CartId,
  customerId: Schema.NullOr(CustomerId),
  buyerName: Schema.String,
  buyerEmail: Email,
  subtotalCents: NonNegativeInt,
  shippingCents: NonNegativeInt,
  totalCents: NonNegativeInt,
  currency: CurrencyCode,
  addresses: Schema.Array(AddressSnapshot),
});

export const OrderList = Schema.Array(Order);

export const DownloadUrlResponse = Schema.Struct({
  downloadUrl: Schema.String,
  expiresAt: Schema.Date,
});

export const ConfirmationSent = Schema.Struct({
  success: Schema.Boolean,
  orderId: OrderId,
});

export class OrderNotFound extends Schema.TaggedErrorClass<OrderNotFound>()(
  "OrderNotFound",
  {
    id: OrderId,
  },
  { httpApiStatus: 404 }
) {}

export class OrderNotPaid extends Schema.TaggedErrorClass<OrderNotPaid>()(
  "OrderNotPaid",
  {
    id: OrderId,
  },
  { httpApiStatus: 400 }
) {}

export class DigitalProductNotFound extends Schema.TaggedErrorClass<DigitalProductNotFound>()(
  "DigitalProductNotFound",
  {
    orderId: OrderId,
  },
  { httpApiStatus: 404 }
) {}
