import * as Schema from "effect/Schema";

export const CartItemId = Schema.String.pipe(Schema.brand("CartItemId"));
export type CartItemId = typeof CartItemId.Type;
