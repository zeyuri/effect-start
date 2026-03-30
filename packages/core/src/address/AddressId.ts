import * as Schema from "effect/Schema";

export const AddressId = Schema.String.pipe(Schema.brand("AddressId"));
export type AddressId = typeof AddressId.Type;
