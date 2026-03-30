import * as Schema from "effect/Schema";

export class ShippingProviderError extends Schema.TaggedErrorClass<ShippingProviderError>()(
  "ShippingProviderError",
  {
    provider: Schema.String,
    code: Schema.String,
    message: Schema.String,
    providerResponse: Schema.Record(Schema.String, Schema.Unknown),
  }
) {}
