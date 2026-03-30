import * as Schema from "effect/Schema";
import { CartId } from "@starter/core/cart/CartId";
import { CartItemId } from "@starter/core/cart/CartItemId";
import { ProductVariantId } from "@starter/core/product/ProductVariantId";
import { Email } from "@starter/core/shared/values/Email";
import { CustomerId } from "@starter/core/customer/CustomerId";
export { Cart } from "@starter/core/cart/Cart";
export { CartId } from "@starter/core/cart/CartId";
export type { CartId as CartIdType } from "@starter/core/cart/CartId";
export { CartItem } from "@starter/core/cart/CartItem";
export { CartItemId } from "@starter/core/cart/CartItemId";
export type { CartItemId as CartItemIdType } from "@starter/core/cart/CartItemId";
export { CartStatus } from "@starter/core/cart/CartStatus";

const PositiveInt = Schema.Int.check(Schema.isGreaterThan(0));

export const CreateCartPayload = Schema.Struct({
  customerId: Schema.NullOr(CustomerId),
  email: Schema.NullOr(Email),
});

export const AddCartItemPayload = Schema.Struct({
  productVariantId: ProductVariantId,
  quantity: PositiveInt,
  unitPriceCents: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
});

export const UpdateCartItemPayload = Schema.Struct({
  quantity: PositiveInt,
});

export class CartNotFound extends Schema.TaggedErrorClass<CartNotFound>()(
  "CartNotFound",
  {
    id: CartId,
  },
  { httpApiStatus: 404 }
) {}

export class CartItemNotFound extends Schema.TaggedErrorClass<CartItemNotFound>()(
  "CartItemNotFound",
  {
    id: CartItemId,
  },
  { httpApiStatus: 404 }
) {}

export class InsufficientStock extends Schema.TaggedErrorClass<InsufficientStock>()(
  "InsufficientStock",
  {
    productVariantId: ProductVariantId,
    requested: Schema.Number,
    available: Schema.Number,
  },
  { httpApiStatus: 409 }
) {}
