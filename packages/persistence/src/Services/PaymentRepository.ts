import * as ServiceMap from "effect/ServiceMap";
import * as Effect from "effect/Effect";
import type { Payment } from "@starter/core/payment/Payment";
import type { PaymentId } from "@starter/core/payment/PaymentId";
import type { PaymentProvider } from "@starter/core/payment/PaymentProvider";
import type { PaymentStatus } from "@starter/core/payment/PaymentStatus";
import type { OrderId } from "@starter/core/order/OrderId";
import type {
  EntityNotFoundError,
  PersistenceError,
} from "../Errors/RepositoryError.ts";

export interface PaymentRepositoryService {
  readonly create: (input: {
    readonly orderId: OrderId;
    readonly provider: PaymentProvider;
    readonly idempotencyKey: string;
    readonly amountCents: number;
    readonly currency: string;
  }) => Effect.Effect<Payment, PersistenceError>;
  readonly getById: (
    id: PaymentId
  ) => Effect.Effect<Payment, EntityNotFoundError | PersistenceError>;
  readonly getByIdempotencyKey: (
    provider: PaymentProvider,
    idempotencyKey: string
  ) => Effect.Effect<Payment | null, PersistenceError>;
  readonly getByOrderId: (
    orderId: OrderId
  ) => Effect.Effect<ReadonlyArray<Payment>, PersistenceError>;
  readonly updateStatus: (
    id: PaymentId,
    status: PaymentStatus,
    providerData?: Record<string, unknown>,
    errorMessage?: string | null
  ) => Effect.Effect<Payment, EntityNotFoundError | PersistenceError>;
  readonly updateProviderId: (
    id: PaymentId,
    providerId: string,
    providerData?: Record<string, unknown>
  ) => Effect.Effect<Payment, EntityNotFoundError | PersistenceError>;
  readonly getByProviderId: (
    provider: PaymentProvider,
    providerId: string
  ) => Effect.Effect<Payment | null, PersistenceError>;
}

export class PaymentRepository extends ServiceMap.Service<
  PaymentRepository,
  PaymentRepositoryService
>()("@starter/persistence/Services/PaymentRepository") {}
