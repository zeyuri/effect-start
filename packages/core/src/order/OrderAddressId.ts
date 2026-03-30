import * as Schema from "effect/Schema";

export const OrderAddressId = Schema.String.pipe(
  Schema.brand("OrderAddressId")
);
export type OrderAddressId = typeof OrderAddressId.Type;
