import {
  PaymentProviderService,
  type CreatePaymentInput,
  type CreatePaymentResult,
  type PaymentProviderServiceShape,
  type PaymentStatusResult,
} from "@starter/core/payment/PaymentProviderService";
import type { PaymentProviderError } from "@starter/core/payment/PaymentProviderError";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

const make: PaymentProviderServiceShape = {
  provider: "woovi",

  createPayment: (
    input: CreatePaymentInput
  ): Effect.Effect<CreatePaymentResult, PaymentProviderError> =>
    Effect.succeed({
      providerId: `test-pix-${Date.now()}`,
      status: "ACTIVE",
      clientData: {
        qrCodeImage:
          "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=test-pix-payment",
        brCode:
          "00020126580014br.gov.bcb.pix0136test-key-00000000-0000-0000-0000-0000000000005204000053039865802BR5913Test Payment6008Curitiba62070503***6304ABCD",
        pixKey: "test-pix-key@example.com",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        correlationID: input.idempotencyKey,
      },
    }),

  getPaymentStatus: (
    providerId: string
  ): Effect.Effect<PaymentStatusResult, PaymentProviderError> =>
    Effect.succeed({
      status: "ACTIVE",
      rawData: { providerId, test: true },
    }),

  cancelPayment: (
    _providerId: string
  ): Effect.Effect<void, PaymentProviderError> => Effect.void,

  refundPayment: (
    _providerId: string,
    _amountCents?: number
  ): Effect.Effect<void, PaymentProviderError> => Effect.void,
};

export const PaymentProviderTestLive = Layer.succeed(
  PaymentProviderService,
  make
);
