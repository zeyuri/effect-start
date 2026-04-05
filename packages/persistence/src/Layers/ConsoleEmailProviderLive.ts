import {
  EmailProviderService,
  type EmailProviderServiceShape,
} from "@starter/core/email/EmailProviderService";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

const make = Effect.succeed({
  provider: "console",
  sendEmail: (_input) =>
    Effect.sync(() => {
      const messageId =
        `console-${Date.now()}-` + `${Math.random().toString(36).slice(2, 8)}`;
      return { messageId, provider: "console" };
    }),
} satisfies EmailProviderServiceShape);

export const ConsoleEmailProviderLive =
  Layer.effect(EmailProviderService)(make);
