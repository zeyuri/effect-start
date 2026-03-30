import * as Schema from "effect/Schema";
import * as SchemaGetter from "effect/SchemaGetter";
import { ProductVariantId } from "../product/ProductVariantId.js";
import { OrderId } from "./OrderId.js";
import { OrderItemId } from "./OrderItemId.js";

const PositiveInt = Schema.Int.check(Schema.isGreaterThan(0));
const NonNegativeInt = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0));

export class OrderItem extends Schema.Class<OrderItem>("OrderItem")({
  id: OrderItemId,
  orderId: OrderId,
  productVariantId: ProductVariantId,
  productName: Schema.String,
  variantName: Schema.String,
  sku: Schema.NullOr(Schema.String),
  quantity: PositiveInt,
  unitPriceCents: NonNegativeInt,
  isDigital: Schema.optional(Schema.Boolean).pipe(
    Schema.decodeTo(Schema.toType(Schema.Boolean), {
      decode: SchemaGetter.withDefault(() => false),
      encode: SchemaGetter.required(),
    })
  ),
  createdAt: Schema.Date,
}) {}
