import * as Schema from "effect/Schema";
import { OrderId } from "../order/OrderId.js";
import { CurrencyCode } from "../shared/values/CurrencyCode.js";
import { PaymentId } from "./PaymentId.js";
import { PaymentProvider } from "./PaymentProvider.js";
import { PaymentStatus } from "./PaymentStatus.js";

const PositiveInt = Schema.Int.check(Schema.isGreaterThan(0));

export class Payment extends Schema.Class<Payment>("Payment")({
  id: PaymentId,
  orderId: OrderId,
  provider: PaymentProvider,
  providerId: Schema.NullOr(Schema.String),
  idempotencyKey: Schema.String,
  status: PaymentStatus,
  amountCents: PositiveInt,
  currency: CurrencyCode,
  providerData: Schema.Record(Schema.String, Schema.Unknown),
  errorMessage: Schema.NullOr(Schema.String),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}) {}
