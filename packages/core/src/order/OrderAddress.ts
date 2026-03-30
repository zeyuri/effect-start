import * as Schema from "effect/Schema";
import * as SchemaGetter from "effect/SchemaGetter";
import { OrderAddressId } from "./OrderAddressId.js";
import { OrderAddressType } from "./OrderAddressType.js";
import { OrderId } from "./OrderId.js";

export class OrderAddress extends Schema.Class<OrderAddress>("OrderAddress")({
  id: OrderAddressId,
  orderId: OrderId,
  type: OrderAddressType,
  fullName: Schema.String,
  line1: Schema.String,
  line2: Schema.NullOr(Schema.String),
  city: Schema.String,
  state: Schema.String,
  postalCode: Schema.String,
  country: Schema.optional(Schema.String).pipe(
    Schema.decodeTo(Schema.toType(Schema.String), {
      decode: SchemaGetter.withDefault(() => "BR"),
      encode: SchemaGetter.required(),
    })
  ),
  phone: Schema.NullOr(Schema.String),
  createdAt: Schema.Date,
}) {}
