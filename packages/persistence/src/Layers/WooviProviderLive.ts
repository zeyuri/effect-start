import {
  PaymentProviderService,
  type CreatePaymentInput,
  type CreatePaymentResult,
  type PaymentProviderServiceShape,
  type PaymentStatusResult,
} from "@starter/core/payment/PaymentProviderService";
import { PaymentProviderError } from "@starter/core/payment/PaymentProviderError";
import * as HttpClient from "effect/unstable/http/HttpClient";
import type * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import { Config, Effect, Layer, pipe } from "effect";
import * as Schema from "effect/Schema";

const WOOVI_API_BASE = "https://api.openpix.com.br/api/v1";

const toProviderError = (err: unknown, code: string): PaymentProviderError =>
  new PaymentProviderError({
    provider: "woovi",
    code,
    message: err instanceof Error ? err.message : String(err),
    providerResponse: {},
  });

const asStringField = (value: unknown, fallback: string): string =>
  typeof value === "string" ? value : fallback;

const JsonObject = Schema.Record(Schema.String, Schema.Unknown);

const decodeJsonObject = Schema.decodeUnknownEffect(JsonObject);

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

const handleWooviError = (
  body: Record<string, unknown>
): PaymentProviderError => {
  const error = body["error"];
  const errorMsg = typeof error === "string" ? error : "Woovi API error";
  return new PaymentProviderError({
    provider: "woovi",
    code: "WOOVI_ERROR",
    message: errorMsg,
    providerResponse: body,
  });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asRecord = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

const make = Effect.gen(function* () {
  const appId = yield* Config.string("WOOVI_APP_ID");
  const httpClient = yield* HttpClient.HttpClient;

  const wooviRequest = (
    method: "POST" | "GET" | "DELETE",
    path: string,
    body?: Record<string, unknown>
  ) =>
    Effect.gen(function* () {
      const url = `${WOOVI_API_BASE}${path}`;
      const makeRequest = HttpClientRequest.make(method);
      const baseRequest = makeRequest(url);
      let request = pipe(
        baseRequest,
        HttpClientRequest.setHeader("Authorization", appId),
        HttpClientRequest.setHeader("Content-Type", "application/json")
      );

      if (body !== undefined) {
        request = HttpClientRequest.bodyJsonUnsafe(request, body);
      }

      const executeEffect = httpClient.execute(request);
      const response = yield* pipe(
        executeEffect,
        Effect.mapError((err) => toProviderError(err, "HTTP_ERROR")),
        Effect.scoped
      );

      const json = yield* parseJsonBody(response);

      if (response.status >= 400) {
        return yield* handleWooviError(json);
      }

      return json;
    });

  const createPayment = (
    input: CreatePaymentInput
  ): Effect.Effect<CreatePaymentResult, PaymentProviderError> =>
    Effect.gen(function* () {
      const responseBody = yield* wooviRequest("POST", "/charge", {
        correlationID: input.idempotencyKey,
        value: input.amountCents,
        comment: `Order ${input.orderId}`,
        additionalInfo: [{ key: "order_id", value: input.orderId }],
      });

      const charge =
        typeof responseBody["charge"] === "object" &&
        responseBody["charge"] !== null
          ? asRecord(responseBody["charge"])
          : responseBody;

      const correlationId = asStringField(charge["correlationID"], "");
      const providerId =
        correlationId !== ""
          ? correlationId
          : asStringField(charge["transactionID"], "");

      return {
        providerId,
        status: asStringField(charge["status"], "ACTIVE"),
        clientData: {
          qrCodeImage: charge["qrCodeImage"],
          brCode: charge["brCode"],
          pixKey: charge["pixKey"],
          expiresAt: charge["expiresDate"],
          correlationID: charge["correlationID"],
        },
      };
    });

  const getPaymentStatus = (
    providerId: string
  ): Effect.Effect<PaymentStatusResult, PaymentProviderError> =>
    Effect.gen(function* () {
      const responseBody = yield* wooviRequest("GET", `/charge/${providerId}`);

      const charge =
        typeof responseBody["charge"] === "object" &&
        responseBody["charge"] !== null
          ? asRecord(responseBody["charge"])
          : responseBody;

      return {
        status: asStringField(charge["status"], "unknown"),
        rawData: responseBody,
      };
    });

  const cancelPayment = (
    providerId: string
  ): Effect.Effect<void, PaymentProviderError> =>
    pipe(
      wooviRequest("DELETE", `/charge/${providerId}`),
      Effect.andThen(Effect.void)
    );

  const refundPayment = (
    providerId: string,
    amountCents?: number
  ): Effect.Effect<void, PaymentProviderError> =>
    Effect.gen(function* () {
      const body: Record<string, unknown> = {
        correlationID: providerId,
      };
      if (amountCents !== undefined) {
        body["value"] = amountCents;
      }
      yield* wooviRequest("POST", "/refund", body);
    });

  return {
    provider: "woovi",
    createPayment,
    getPaymentStatus,
    cancelPayment,
    refundPayment,
  } satisfies PaymentProviderServiceShape;
});

export const WooviProviderLive = Layer.effect(PaymentProviderService)(make);
