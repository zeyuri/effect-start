import * as Schema from "effect/Schema";
import * as SchemaGetter from "effect/SchemaGetter";
import { AddressId } from "./AddressId.js";

export class Address extends Schema.Class<Address>("Address")({
  id: AddressId,
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
  updatedAt: Schema.Date,
}) {}
