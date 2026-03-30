import * as Schema from "effect/Schema";
import { PaymentProvider } from "./PaymentProvider.js";

export class PaymentProviderError extends Schema.TaggedErrorClass<PaymentProviderError>()(
  "PaymentProviderError",
  {
    provider: PaymentProvider,
    code: Schema.String,
    message: Schema.String,
    providerResponse: Schema.Record(Schema.String, Schema.Unknown),
  }
) {}
