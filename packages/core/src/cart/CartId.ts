import * as Schema from "effect/Schema";

export const CartId = Schema.String.pipe(Schema.brand("CartId"));
export type CartId = typeof CartId.Type;
