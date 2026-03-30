import * as Schema from "effect/Schema";

export const CartStatus = Schema.Literals(["active", "completed", "abandoned"]);
export type CartStatus = typeof CartStatus.Type;
