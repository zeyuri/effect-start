import * as Effect from "effect/Effect";
import * as ServiceMap from "effect/ServiceMap";
import type { PaymentProvider } from "./PaymentProvider.js";
import type { PaymentProviderError } from "./PaymentProviderError.js";

export interface CreatePaymentInput {
  readonly orderId: string;
  readonly amountCents: number;
  readonly currency: string;
  readonly idempotencyKey: string;
  readonly metadata: Record<string, unknown>;
}

export interface CreatePaymentResult {
  readonly providerId: string;
  readonly status: string;
  readonly clientData: Record<string, unknown>;
}

export interface PaymentStatusResult {
  readonly status: string;
  readonly rawData: Record<string, unknown>;
}

export interface PaymentProviderServiceShape {
  readonly provider: PaymentProvider;
  readonly createPayment: (
    input: CreatePaymentInput
  ) => Effect.Effect<CreatePaymentResult, PaymentProviderError>;
  readonly getPaymentStatus: (
    providerId: string
  ) => Effect.Effect<PaymentStatusResult, PaymentProviderError>;
  readonly cancelPayment: (
    providerId: string
  ) => Effect.Effect<void, PaymentProviderError>;
  readonly refundPayment: (
    providerId: string,
    amountCents?: number
  ) => Effect.Effect<void, PaymentProviderError>;
}

export class PaymentProviderService extends ServiceMap.Service<
  PaymentProviderService,
  PaymentProviderServiceShape
>()("@starter/core/payment/PaymentProviderService") {}
