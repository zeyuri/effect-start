import {
  PaymentProviderService,
  type CreatePaymentInput,
  type CreatePaymentResult,
  type PaymentProviderServiceShape,
  type PaymentStatusResult,
} from "@starter/core/payment/PaymentProviderService";
import { PaymentProviderError } from "@starter/core/payment/PaymentProviderError";
import * as HttpBody from "effect/unstable/http/HttpBody";
import * as HttpClient from "effect/unstable/http/HttpClient";
import type * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import { Config, Effect, Layer, pipe } from "effect";
import * as Schema from "effect/Schema";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

const encodeFormData = (params: Record<string, string>): string =>
  Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

const toProviderError = (err: unknown, code: string): PaymentProviderError =>
  new PaymentProviderError({
    provider: "stripe",
    code,
    message: err instanceof Error ? err.message : String(err),
    providerResponse: {},
  });

const asStringField = (value: unknown, fallback: string): string =>
  typeof value === "string" ? value : fallback;

const JsonObject = Schema.Record(Schema.String, Schema.Unknown);

const decodeJsonObject = Schema.decodeUnknownEffect(JsonObject);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asRecord = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

const parseJsonBody = (
  response: HttpClientResponse.HttpClientResponse
): Effect.Effect<Record<string, unknown>, PaymentProviderError> =>
  pipe(
    response.json,
    Effect.mapError((err) => toProviderError(err, "RESPONSE_PARSE_ERROR")),
    Effect.flatMap((body) => {
      const decoded = decodeJsonObject(body);
      return pipe(
        decoded,
        Effect.mapError((err) => toProviderError(err, "RESPONSE_PARSE_ERROR"))
      );
    })
  );

const handleStripeError = (
  body: Record<string, unknown>
): PaymentProviderError => {
  const error = body["error"];
  const errorObj = asRecord(error);
  return new PaymentProviderError({
    provider: "stripe",
    code: asStringField(errorObj["code"], "STRIPE_ERROR"),
    message: asStringField(errorObj["message"], "Stripe API error"),
    providerResponse: body,
  });
};

const make = Effect.gen(function* () {
  const secretKey = yield* Config.string("STRIPE_SECRET_KEY");
  const httpClient = yield* HttpClient.HttpClient;

  const stripeRequest = (
    method: "POST" | "GET",
    path: string,
    body?: Record<string, string>
  ) =>
    Effect.gen(function* () {
      const url = `${STRIPE_API_BASE}${path}`;
      const makeRequest = HttpClientRequest.make(method);
      const baseRequest = makeRequest(url);
      let request = pipe(
        baseRequest,
        HttpClientRequest.setHeader("Authorization", `Bearer ${secretKey}`),
        HttpClientRequest.setHeader(
          "Content-Type",
          "application/x-www-form-urlencoded"
        )
      );

      if (body !== undefined) {
        const formBody = encodeFormData(body);
        request = pipe(
          request,
          HttpClientRequest.setBody(
            HttpBody.text(formBody, "application/x-www-form-urlencoded")
          )
        );
      }

      const executeEffect = httpClient.execute(request);
      const response = yield* pipe(
        executeEffect,
        Effect.mapError((err) => toProviderError(err, "HTTP_ERROR")),
        Effect.scoped
      );

      const json = yield* parseJsonBody(response);

      if (response.status >= 400) {
        return yield* handleStripeError(json);
      }

      return json;
    });

  const createPayment = (
    input: CreatePaymentInput
  ): Effect.Effect<CreatePaymentResult, PaymentProviderError> =>
    Effect.gen(function* () {
      const params: Record<string, string> = {
        amount: String(input.amountCents),
        currency: input.currency.toLowerCase(),
        "metadata[order_id]": input.orderId,
        "metadata[idempotency_key]": input.idempotencyKey,
      };

      for (const [key, value] of Object.entries(input.metadata)) {
        if (typeof value === "string") {
          params[`metadata[${key}]`] = value;
        }
      }

      const body = yield* stripeRequest("POST", "/payment_intents", params);

      return {
        providerId: asStringField(body["id"], ""),
        status: asStringField(body["status"], "pending"),
        clientData: {
          clientSecret: body["client_secret"],
          paymentIntentId: body["id"],
        },
      };
    });

  const getPaymentStatus = (
    providerId: string
  ): Effect.Effect<PaymentStatusResult, PaymentProviderError> =>
    Effect.gen(function* () {
      const body = yield* stripeRequest(
        "GET",
        `/payment_intents/${providerId}`
      );

      return {
        status: asStringField(body["status"], "unknown"),
        rawData: body,
      };
    });

  const cancelPayment = (
    providerId: string
  ): Effect.Effect<void, PaymentProviderError> =>
    pipe(
      stripeRequest("POST", `/payment_intents/${providerId}/cancel`),
      Effect.andThen(Effect.void)
    );

  const refundPayment = (
    providerId: string,
    amountCents?: number
  ): Effect.Effect<void, PaymentProviderError> =>
    Effect.gen(function* () {
      const params: Record<string, string> = {
        payment_intent: providerId,
      };
      if (amountCents !== undefined) {
        params["amount"] = String(amountCents);
      }
      yield* stripeRequest("POST", "/refunds", params);
    });

  return {
    provider: "stripe",
    createPayment,
    getPaymentStatus,
    cancelPayment,
    refundPayment,
  } satisfies PaymentProviderServiceShape;
});

export const StripeProviderLive = Layer.effect(PaymentProviderService)(make);
