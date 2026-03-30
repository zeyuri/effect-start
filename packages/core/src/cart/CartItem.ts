import * as Schema from "effect/Schema";
import { ProductVariantId } from "../product/ProductVariantId.js";
import { CartId } from "./CartId.js";
import { CartItemId } from "./CartItemId.js";

const PositiveInt = Schema.Int.check(Schema.isGreaterThan(0));
const NonNegativeInt = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0));

export class CartItem extends Schema.Class<CartItem>("CartItem")({
  id: CartItemId,
  cartId: CartId,
  productVariantId: ProductVariantId,
  quantity: PositiveInt,
  unitPriceCents: NonNegativeInt,
  createdAt: Schema.Date,
}) {}
