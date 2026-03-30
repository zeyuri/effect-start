import * as Schema from "effect/Schema";

export const ProductId = Schema.String.pipe(Schema.brand("ProductId"));
export type ProductId = typeof ProductId.Type;
