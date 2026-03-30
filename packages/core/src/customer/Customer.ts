import * as Schema from "effect/Schema";
import { AddressId } from "../address/AddressId.js";
import { Email } from "../shared/values/Email.js";
import { CustomerId } from "./CustomerId.js";

export class Customer extends Schema.Class<Customer>("Customer")({
  id: CustomerId,
  email: Email,
  name: Schema.String,
  defaultAddressId: Schema.NullOr(AddressId),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}) {}
