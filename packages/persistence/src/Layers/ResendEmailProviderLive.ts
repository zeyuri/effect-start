import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import {
  EmailProviderService,
  type EmailProviderServiceShape,
} from "@starter/core/email/EmailProviderService";
import { EmailProviderError } from "@starter/core/email/EmailProviderError";

const asStringField = (value: unknown, fallback: string): string =>
  typeof value === "string" ? value : fallback;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asRecord = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

const extractMessageId = (body: unknown): string => {
  const record = asRecord(body);
  return asStringField(record["id"], `resend-${Date.now()}`);
};

const make = Effect.gen(function* () {
  const apiKey = yield* Config.string("RESEND_API_KEY");
  const resendFromAddress = Config.string("RESEND_FROM_ADDRESS");
  const fromAddress = yield* pipe(
    resendFromAddress,
    Config.withDefault(() => "noreply@example.com")
  );
  const httpClient = yield* HttpClient.HttpClient;

  const sendEmail: EmailProviderServiceShape["sendEmail"] = (input) =>
    Effect.gen(function* () {
      const makeReq = HttpClientRequest.post("https://api.resend.com/emails");
      const withHeaders = HttpClientRequest.setHeaders(makeReq, {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      });
      const withBody = HttpClientRequest.bodyJsonUnsafe(withHeaders, {
        from: fromAddress,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        reply_to: input.replyTo,
      });

      const executeReq = httpClient.execute(withBody);
      const response = yield* pipe(
        executeReq,
        Effect.mapError((err) =>
          new EmailProviderError({
            provider: "resend",
            code: "NETWORK_ERROR",
            message: String(err),
          })
        )
      );

      if (response.status >= 400) {
        const text = yield* pipe(
          response.text,
          Effect.orElseSucceed(() => "Unknown error")
        );
        return yield* new EmailProviderError({
          provider: "resend",
          code: `HTTP_${String(response.status)}`,
          message: text,
        });
      }

      const body = yield* pipe(response.json, Effect.orElseSucceed(() => ({})));

      const messageId = extractMessageId(body);

      return { messageId, provider: "resend" };
    });

  return {
    provider: "resend",
    sendEmail,
  } satisfies EmailProviderServiceShape;
});

export const ResendEmailProviderLive = Layer.effect(EmailProviderService)(make);
