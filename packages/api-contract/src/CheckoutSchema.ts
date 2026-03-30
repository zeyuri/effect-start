import * as Schema from "effect/Schema";
import { PaymentId } from "@starter/core/payment/PaymentId";
import { PaymentProvider } from "@starter/core/payment/PaymentProvider";
import { PaymentStatus } from "@starter/core/payment/PaymentStatus";
import { OrderId } from "@starter/core/order/OrderId";

export { PaymentId } from "@starter/core/payment/PaymentId";
export { PaymentProvider } from "@starter/core/payment/PaymentProvider";
export { PaymentStatus } from "@starter/core/payment/PaymentStatus";
export { Payment } from "@starter/core/payment/Payment";

export const InitiatePaymentPayload = Schema.Struct({
  orderId: OrderId,
  provider: PaymentProvider,
  idempotencyKey: Schema.String,
});

export const InitiatePaymentResponse = Schema.Struct({
  paymentId: PaymentId,
  status: PaymentStatus,
  clientData: Schema.Record(Schema.String, Schema.Unknown),
});

export const PaymentStatusResponse = Schema.Struct({
  paymentId: PaymentId,
  orderId: OrderId,
  provider: PaymentProvider,
  status: PaymentStatus,
  providerData: Schema.Record(Schema.String, Schema.Unknown),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
});

export class PaymentNotFound extends Schema.TaggedErrorClass<PaymentNotFound>()(
  "PaymentNotFound",
  {
    id: PaymentId,
  },
  { httpApiStatus: 404 }
) {}

export class CheckoutError extends Schema.TaggedErrorClass<CheckoutError>()(
  "CheckoutError",
  {
    message: Schema.String,
  },
  { httpApiStatus: 400 }
) {}
