import * as Schema from "effect/Schema";

export const OrderAddressType = Schema.Literals(["shipping", "billing"]);
export type OrderAddressType = typeof OrderAddressType.Type;
