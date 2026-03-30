import * as Schema from "effect/Schema";
import * as SchemaGetter from "effect/SchemaGetter";
import { ProductId } from "./ProductId.js";
import { ProductVariant } from "./ProductVariant.js";

export class Product extends Schema.Class<Product>("Product")({
  id: ProductId,
  name: Schema.String,
  description: Schema.String,
  imageUrl: Schema.String,
  priceCents: Schema.optional(Schema.Int).pipe(
    Schema.decodeTo(Schema.toType(Schema.Int), {
      decode: SchemaGetter.withDefault(() => 0),
      encode: SchemaGetter.required(),
    })
  ),
  variants: Schema.Array(ProductVariant),
}) {}
