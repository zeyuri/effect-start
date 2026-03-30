import * as Schema from "effect/Schema";
import * as SchemaGetter from "effect/SchemaGetter";
import { CustomerId } from "../customer/CustomerId.js";
import { Email } from "../shared/values/Email.js";
import { CartId } from "./CartId.js";
import { CartItem } from "./CartItem.js";
import { CartStatus } from "./CartStatus.js";

const CartItemArray = Schema.Array(CartItem);

export class Cart extends Schema.Class<Cart>("Cart")({
  id: CartId,
  customerId: Schema.NullOr(CustomerId),
  email: Schema.NullOr(Email),
  status: CartStatus,
  metadata: Schema.Record(Schema.String, Schema.Unknown),
  items: Schema.optional(CartItemArray).pipe(
    Schema.decodeTo(Schema.toType(CartItemArray), {
      decode: SchemaGetter.withDefault(
        (): ReadonlyArray<CartItem> => []
      ),
      encode: SchemaGetter.required(),
    })
  ),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}) {}
