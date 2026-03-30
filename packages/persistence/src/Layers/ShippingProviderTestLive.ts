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
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

const make: ShippingProviderServiceShape = {
  provider: "test",

  calculateShipping: (
    _input: ShippingQuoteInput
  ): Effect.Effect<ReadonlyArray<ShippingQuoteResult>, ShippingProviderError> =>
    Effect.succeed([
      {
        carrier: "Correios",
        service: "SEDEX",
        priceCents: 2590,
        deliveryDays: 3,
        providerData: { test: true },
      },
      {
        carrier: "Correios",
        service: "PAC",
        priceCents: 1490,
        deliveryDays: 7,
        providerData: { test: true },
      },
      {
        carrier: "Jadlog",
        service: ".Package",
        priceCents: 1890,
        deliveryDays: 5,
        providerData: { test: true },
      },
    ]),

  createShipment: (
    _input: CreateShipmentInput
  ): Effect.Effect<CreateShipmentResult, ShippingProviderError> =>
    Effect.succeed({
      shipmentId: `test-shipment-${Date.now()}`,
      trackingCode: `TST${Date.now()}BR`,
      labelUrl: "https://example.com/label.pdf",
      providerData: { test: true },
    }),

  cancelShipment: (
    _shipmentId: string
  ): Effect.Effect<void, ShippingProviderError> => Effect.void,

  getTracking: (
    trackingCode: string
  ): Effect.Effect<TrackingResult, ShippingProviderError> =>
    Effect.succeed({
      status: "in_transit",
      events: [
        {
          date: new Date().toISOString(),
          description: "Package dispatched",
          location: "Test Distribution Center",
        },
      ],
      rawData: { test: true, trackingCode },
    }),
};

export const ShippingProviderTestLive = Layer.succeed(
  ShippingProviderService,
  make
);
