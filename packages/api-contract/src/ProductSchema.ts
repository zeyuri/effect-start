import * as Schema from "effect/Schema";
import { ProductId } from "@starter/core/product/ProductId";

export { Product } from "@starter/core/product/Product";
export { ProductId } from "@starter/core/product/ProductId";
export type { ProductId as ProductIdType } from "@starter/core/product/ProductId";
export { ProductVariant } from "@starter/core/product/ProductVariant";
export { ProductVariantId } from "@starter/core/product/ProductVariantId";
export type { ProductVariantId as ProductVariantIdType } from "@starter/core/product/ProductVariantId";
export { CurrencyCode } from "@starter/core/shared/values/CurrencyCode";
export type { CurrencyCode as CurrencyCodeType } from "@starter/core/shared/values/CurrencyCode";

export class ProductNotFound extends Schema.TaggedErrorClass<ProductNotFound>()(
  "ProductNotFound",
  {
    id: ProductId,
  },
  { httpApiStatus: 404 }
) {}

export const CreateProductPayload = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
  imageUrl: Schema.String,
  priceCents: Schema.Int,
});

export class InvalidProduct extends Schema.TaggedErrorClass<InvalidProduct>()(
  "InvalidProduct",
  {
    message: Schema.String,
  },
  { httpApiStatus: 400 }
) {}
