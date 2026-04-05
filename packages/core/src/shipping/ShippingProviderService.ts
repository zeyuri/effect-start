import * as Effect from "effect/Effect";
import * as ServiceMap from "effect/ServiceMap";
import type { ShippingProviderError } from "./ShippingProviderError.js";

export interface PackageDimensions {
  readonly weightG: number;
  readonly lengthCm: number;
  readonly widthCm: number;
  readonly heightCm: number;
}

export interface ShippingQuoteInput {
  readonly originPostalCode: string;
  readonly destinationPostalCode: string;
  readonly packages: ReadonlyArray<PackageDimensions>;
}

export interface ShippingQuoteResult {
  readonly carrier: string;
  readonly service: string;
  readonly priceCents: number;
  readonly deliveryDays: number;
  readonly providerData: Record<string, unknown>;
}

export interface CreateShipmentInput {
  readonly orderId: string;
  readonly quoteId: string;
  readonly carrier: string;
  readonly service: string;
  readonly originPostalCode: string;
  readonly destinationPostalCode: string;
  readonly packages: ReadonlyArray<PackageDimensions>;
  readonly recipientName: string;
  readonly recipientAddress: string;
}

export interface CreateShipmentResult {
  readonly shipmentId: string;
  readonly trackingCode: string;
  readonly labelUrl: string;
  readonly providerData: Record<string, unknown>;
}

export interface TrackingResult {
  readonly status: string;
  readonly events: ReadonlyArray<{
    readonly date: string;
    readonly description: string;
    readonly location: string;
  }>;
  readonly rawData: Record<string, unknown>;
}

export interface ShippingProviderServiceShape {
  readonly provider: string;
  readonly calculateShipping: (
    input: ShippingQuoteInput
  ) => Effect.Effect<ReadonlyArray<ShippingQuoteResult>, ShippingProviderError>;
  readonly createShipment: (
    input: CreateShipmentInput
  ) => Effect.Effect<CreateShipmentResult, ShippingProviderError>;
  readonly cancelShipment: (
    shipmentId: string
  ) => Effect.Effect<void, ShippingProviderError>;
  readonly getTracking: (
    trackingCode: string
  ) => Effect.Effect<TrackingResult, ShippingProviderError>;
}

export class ShippingProviderService extends ServiceMap.Service<
  ShippingProviderService,
  ShippingProviderServiceShape
>()("@starter/core/shipping/ShippingProviderService") {}
