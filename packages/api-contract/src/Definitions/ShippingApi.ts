import * as HttpApiEndpoint from "effect/unstable/httpapi/HttpApiEndpoint";
import * as HttpApiGroup from "effect/unstable/httpapi/HttpApiGroup";
import {
  CalculateShippingPayload,
  ShippingCalculationError,
  ShippingQuotesResponse,
} from "../ShippingSchema.js";

export class ShippingApiGroup extends HttpApiGroup.make("shipping").add(
  HttpApiEndpoint.post("calculateShipping", "/shipping/calculate", {
    payload: CalculateShippingPayload,
    success: ShippingQuotesResponse,
    error: ShippingCalculationError,
  })
) {}
