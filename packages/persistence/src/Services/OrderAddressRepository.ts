import * as ServiceMap from "effect/ServiceMap";
import * as Effect from "effect/Effect";
import type { OrderAddress } from "@starter/core/order/OrderAddress";
import type { OrderAddressType } from "@starter/core/order/OrderAddressType";
import type { OrderId } from "@starter/core/order/OrderId";
import type { PersistenceError } from "../Errors/RepositoryError.ts";

export interface OrderAddressRepositoryService {
  readonly create: (input: {
    readonly orderId: OrderId;
    readonly type: OrderAddressType;
    readonly fullName: string;
    readonly line1: string;
    readonly line2: string | null;
    readonly city: string;
    readonly state: string;
    readonly postalCode: string;
    readonly country: string;
    readonly phone: string | null;
  }) => Effect.Effect<OrderAddress, PersistenceError>;
  readonly getByOrderId: (
    orderId: OrderId
  ) => Effect.Effect<ReadonlyArray<OrderAddress>, PersistenceError>;
}

export class OrderAddressRepository extends ServiceMap.Service<
  OrderAddressRepository,
  OrderAddressRepositoryService
>()("@starter/persistence/Services/OrderAddressRepository") {}
