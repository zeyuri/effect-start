import * as Schema from "effect/Schema";
import * as SchemaGetter from "effect/SchemaGetter";
import { CurrencyCode } from "../shared/values/CurrencyCode.js";
import { ProductVariantId } from "./ProductVariantId.js";

export class ProductVariant extends Schema.Class<ProductVariant>(
  "ProductVariant"
)({
  id: ProductVariantId,
  name: Schema.String,
  priceInCents: Schema.Int,
  currency: CurrencyCode,
  isDigital: Schema.optional(Schema.Boolean).pipe(
    Schema.decodeTo(Schema.toType(Schema.Boolean), {
      decode: SchemaGetter.withDefault(() => false),
      encode: SchemaGetter.required(),
    })
  ),
}) {}
