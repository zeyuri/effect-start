import * as Effect from "effect/Effect";
import * as ServiceMap from "effect/ServiceMap";
import type { EmailProviderError } from "./EmailProviderError.js";

export interface SendEmailInput {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly replyTo?: string;
}

export interface SendEmailResult {
  readonly messageId: string;
  readonly provider: string;
}

export interface EmailProviderServiceShape {
  readonly provider: string;
  readonly sendEmail: (
    input: SendEmailInput
  ) => Effect.Effect<SendEmailResult, EmailProviderError>;
}

export class EmailProviderService extends ServiceMap.Service<
  EmailProviderService,
  EmailProviderServiceShape
>()("@starter/core/email/EmailProviderService") {}
