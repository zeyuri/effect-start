import * as ServiceMap from "effect/ServiceMap";
import * as Effect from "effect/Effect";
import type { OrderId } from "@starter/core/order/OrderId";
import type { PersistenceError } from "../Errors/RepositoryError.ts";

export type FulfillmentType = "physical" | "digital";

export type FulfillmentStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "failed";

export interface Fulfillment {
  readonly id: string;
  readonly orderId: OrderId;
  readonly type: FulfillmentType;
  readonly status: FulfillmentStatus;
  readonly provider: string | null;
  readonly trackingCode: string | null;
  readonly shippedAt: Date | null;
  readonly deliveredAt: Date | null;
  readonly cancelledAt: Date | null;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface FulfillmentRepositoryService {
  readonly create: (input: {
    readonly orderId: OrderId;
    readonly type: FulfillmentType;
    readonly status?: FulfillmentStatus;
    readonly provider?: string;
    readonly metadata?: Record<string, unknown>;
  }) => Effect.Effect<Fulfillment, PersistenceError>;
  readonly getById: (
    id: string
  ) => Effect.Effect<Fulfillment | null, PersistenceError>;
  readonly getByOrderId: (
    orderId: OrderId
  ) => Effect.Effect<ReadonlyArray<Fulfillment>, PersistenceError>;
  readonly updateStatus: (
    id: string,
    status: FulfillmentStatus,
    metadata?: Record<string, unknown>
  ) => Effect.Effect<Fulfillment, PersistenceError>;
}

export class FulfillmentRepository extends ServiceMap.Service<
  FulfillmentRepository,
  FulfillmentRepositoryService
>()("@starter/persistence/Services/FulfillmentRepository") {}
