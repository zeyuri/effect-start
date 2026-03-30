import * as Schema from "effect/Schema";

export const OrderItemId = Schema.String.pipe(Schema.brand("OrderItemId"));
export type OrderItemId = typeof OrderItemId.Type;
