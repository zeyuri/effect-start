import * as Schema from "effect/Schema";

export class EmailProviderError extends Schema.TaggedErrorClass<EmailProviderError>()(
  "EmailProviderError",
  {
    provider: Schema.String,
    code: Schema.String,
    message: Schema.String,
  }
) {}
