import * as Schema from "effect/Schema";
export { CartId } from "@starter/core/cart/CartId";

const PositiveNumber = Schema.Number.check(Schema.isGreaterThan(0));

export const PackageDimensionsSchema = Schema.Struct({
  weightG: PositiveNumber,
  lengthCm: PositiveNumber,
  widthCm: PositiveNumber,
  heightCm: PositiveNumber,
});

export const CalculateShippingPayload = Schema.Struct({
  originPostalCode: Schema.String,
  destinationPostalCode: Schema.String,
  packages: Schema.Array(PackageDimensionsSchema),
});

export const ShippingQuoteResponse = Schema.Struct({
  carrier: Schema.String,
  service: Schema.String,
  priceCents: Schema.Number,
  deliveryDays: Schema.Number,
});

export const ShippingQuotesResponse = Schema.Array(ShippingQuoteResponse);

export class ShippingCalculationError extends Schema.TaggedErrorClass<ShippingCalculationError>()(
  "ShippingCalculationError",
  {
    message: Schema.String,
  },
  { httpApiStatus: 400 }
) {}
