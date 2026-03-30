import * as HttpApiEndpoint from "effect/unstable/httpapi/HttpApiEndpoint";
import * as HttpApiGroup from "effect/unstable/httpapi/HttpApiGroup";
import {
  CheckoutError,
  InitiatePaymentPayload,
  InitiatePaymentResponse,
  PaymentId,
  PaymentNotFound,
  PaymentStatusResponse,
} from "./CheckoutSchema.js";

export class CheckoutApiGroup extends HttpApiGroup.make("checkout")
  .add(
    HttpApiEndpoint.post("initiatePayment", "/checkout/initiate-payment", {
      payload: InitiatePaymentPayload,
      success: InitiatePaymentResponse.annotate({ httpApiStatus: 201 }),
      error: CheckoutError,
    })
  )
  .add(
    HttpApiEndpoint.get(
      "getPaymentStatus",
      "/checkout/payment-status/:paymentId",
      {
        params: { paymentId: PaymentId },
        success: PaymentStatusResponse,
        error: PaymentNotFound,
      }
    )
  ) {}
