import {
  ShippingProviderService,
  type CreateShipmentInput,
  type CreateShipmentResult,
  type ShippingProviderServiceShape,
  type ShippingQuoteInput,
  type ShippingQuoteResult,
  type TrackingResult,
} from "@starter/core/shipping/ShippingProviderService";
import { ShippingProviderError } from "@starter/core/shipping/ShippingProviderError";
import * as HttpClient from "effect/unstable/http/HttpClient";
import type * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import { Config, Effect, Layer, pipe } from "effect";
import * as Schema from "effect/Schema";

const PRODUCTION_BASE = "https://melhorenvio.com.br/api/v2/me";
const SANDBOX_BASE = "https://sandbox.melhorenvio.com.br/api/v2/me";

const toProviderError = (err: unknown, code: string): ShippingProviderError =>
  new ShippingProviderError({
    provider: "melhor_envio",
    code,
    message: err instanceof Error ? err.message : String(err),
    providerResponse: {},
  });

const asStringField = (value: unknown, fallback: string): string =>
  typeof value === "string" ? value : fallback;

const asNumberField = (value: unknown, fallback: number): number =>
  typeof value === "number" ? value : fallback;

const JsonObject = Schema.Record(Schema.String, Schema.Unknown);

const decodeJsonObject = Schema.decodeUnknownEffect(JsonObject);

const parseJsonBody = (
  response: HttpClientResponse.HttpClientResponse
): Effect.Effect<Record<string, unknown>, ShippingProviderError> =>
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

const handleMelhorEnvioError = (
  body: Record<string, unknown>
): ShippingProviderError => {
  const message = asStringField(
    body["message"],
    asStringField(body["error"], "Melhor Envio API error")
  );
  return new ShippingProviderError({
    provider: "melhor_envio",
    code: "MELHOR_ENVIO_ERROR",
    message,
    providerResponse: body,
  });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asRecord = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

const asArray = (value: unknown): ReadonlyArray<unknown> =>
  Array.isArray(value) ? value : [];

const firstOrSelf = (
  value: unknown,
  fallback: Record<string, unknown>
): Record<string, unknown> => {
  if (Array.isArray(value)) {
    return asRecord(value[0]);
  }
  if (typeof value === "object" && value !== null) {
    return asRecord(value);
  }
  return fallback;
};

const make = Effect.gen(function* () {
  const accessToken = yield* Config.string("MELHOR_ENVIO_TOKEN");
  const isSandbox = yield* Config.withDefault(
    Config.boolean("MELHOR_ENVIO_SANDBOX"),
    () => true
  );
  const httpClient = yield* HttpClient.HttpClient;
  const apiBase = isSandbox ? SANDBOX_BASE : PRODUCTION_BASE;

  const melhorEnvioRequest = (
    method: "POST" | "GET" | "DELETE",
    path: string,
    body?: Record<string, unknown>
  ) =>
    Effect.gen(function* () {
      const url = `${apiBase}${path}`;
      const makeRequest = HttpClientRequest.make(method);
      const baseRequest = makeRequest(url);
      let request = pipe(
        baseRequest,
        HttpClientRequest.setHeader("Authorization", `Bearer ${accessToken}`),
        HttpClientRequest.setHeader("Content-Type", "application/json"),
        HttpClientRequest.setHeader("Accept", "application/json")
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
        return yield* handleMelhorEnvioError(json);
      }

      return json;
    });

  const calculateShipping = (
    input: ShippingQuoteInput
  ): Effect.Effect<ReadonlyArray<ShippingQuoteResult>, ShippingProviderError> =>
    Effect.gen(function* () {
      const products = input.packages.map((pkg) => ({
        weight: pkg.weightG / 1000,
        width: pkg.widthCm,
        height: pkg.heightCm,
        length: pkg.lengthCm,
        insurance_value: 0,
        quantity: 1,
      }));

      const body = yield* melhorEnvioRequest("POST", "/shipment/calculate", {
        from: { postal_code: input.originPostalCode },
        to: { postal_code: input.destinationPostalCode },
        products,
      });

      const quotesField = body["quotes"];
      const rawQuotes = asArray(quotesField);

      const quotes: Array<ShippingQuoteResult> = [];
      for (const raw of rawQuotes) {
        const quote = asRecord(raw);
        const hasError = quote["error"] !== undefined;
        if (hasError) {
          continue;
        }
        const priceField = quote["price"];
        const customPriceField = quote["custom_price"];
        const priceStr = asStringField(
          priceField,
          asStringField(customPriceField, "0")
        );
        const priceCents = Math.round(parseFloat(priceStr) * 100);
        const deliveryRange = asRecord(quote["delivery_range"]);
        quotes.push({
          carrier: asStringField(
            asRecord(quote["company"])["name"],
            asStringField(quote["name"], "unknown")
          ),
          service: asStringField(quote["name"], "unknown"),
          priceCents,
          deliveryDays: asNumberField(
            quote["delivery_time"],
            asNumberField(deliveryRange["max"], 0)
          ),
          providerData: quote,
        });
      }

      return quotes;
    });

  const createShipment = (
    input: CreateShipmentInput
  ): Effect.Effect<CreateShipmentResult, ShippingProviderError> =>
    Effect.gen(function* () {
      const cartBody = yield* melhorEnvioRequest("POST", "/cart", {
        service: input.service,
        from: { postal_code: input.originPostalCode },
        to: {
          name: input.recipientName,
          address: input.recipientAddress,
          postal_code: input.destinationPostalCode,
        },
        products: input.packages.map((pkg) => ({
          weight: pkg.weightG / 1000,
          width: pkg.widthCm,
          height: pkg.heightCm,
          length: pkg.lengthCm,
          insurance_value: 0,
          quantity: 1,
        })),
        options: {
          receipt: false,
          own_hand: false,
        },
      });

      const cartId = asStringField(cartBody["id"], "");

      const checkoutBody = yield* melhorEnvioRequest(
        "POST",
        "/shipment/checkout",
        { orders: [cartId] }
      );

      const purchaseData = firstOrSelf(checkoutBody["purchase"], checkoutBody);

      const shipmentId = asStringField(purchaseData["id"], cartId);

      const generateBody = yield* melhorEnvioRequest(
        "POST",
        "/shipment/generate",
        { orders: [shipmentId] }
      );

      const generated = firstOrSelf(generateBody["orders"], generateBody);

      return {
        shipmentId,
        trackingCode: asStringField(
          generated["tracking"],
          asStringField(purchaseData["tracking"], "")
        ),
        labelUrl: asStringField(
          generated["print_url"],
          asStringField(purchaseData["print_url"], "")
        ),
        providerData: {
          cartId,
          purchase: purchaseData,
          generated,
        },
      };
    });

  const cancelShipment = (
    shipmentId: string
  ): Effect.Effect<void, ShippingProviderError> =>
    pipe(
      melhorEnvioRequest("POST", "/shipment/cancel", {
        order: { id: shipmentId, reason_id: 2 },
      }),
      Effect.andThen(Effect.void)
    );

  const getTracking = (
    trackingCode: string
  ): Effect.Effect<TrackingResult, ShippingProviderError> =>
    Effect.gen(function* () {
      const body = yield* melhorEnvioRequest("POST", "/shipment/tracking", {
        orders: [trackingCode],
      });

      const trackingData = asRecord(body[trackingCode]);

      const rawEvents = asArray(trackingData["events"]);

      const events = rawEvents.map((raw) => {
        const event = asRecord(raw);
        return {
          date: asStringField(event["date"], ""),
          description: asStringField(
            event["description"],
            asStringField(event["message"], "")
          ),
          location: asStringField(event["location"], ""),
        };
      });

      return {
        status: asStringField(trackingData["status"], "unknown"),
        events,
        rawData: body,
      };
    });

  return {
    provider: "melhor_envio",
    calculateShipping,
    createShipment,
    cancelShipment,
    getTracking,
  } satisfies ShippingProviderServiceShape;
});

export const MelhorEnvioClientLive = Layer.effect(
  ShippingProviderService,
)(make);
