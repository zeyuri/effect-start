import * as Schema from "effect/Schema";

export const ProductVariantId = Schema.String.pipe(
  Schema.brand("ProductVariantId")
);
export type ProductVariantId = typeof ProductVariantId.Type;
