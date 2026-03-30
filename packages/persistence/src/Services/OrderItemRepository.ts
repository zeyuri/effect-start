import * as ServiceMap from "effect/ServiceMap";
import * as Effect from "effect/Effect";
import type { OrderItem } from "@starter/core/order/OrderItem";
import type { OrderId } from "@starter/core/order/OrderId";
import type { ProductVariantId } from "@starter/core/product/ProductVariantId";
import type { PersistenceError } from "../Errors/RepositoryError.ts";

export interface OrderItemRepositoryService {
  readonly create: (input: {
    readonly orderId: OrderId;
    readonly productVariantId: ProductVariantId;
    readonly productName: string;
    readonly variantName: string;
    readonly sku: string | null;
    readonly quantity: number;
    readonly unitPriceCents: number;
    readonly isDigital: boolean;
  }) => Effect.Effect<OrderItem, PersistenceError>;
  readonly getByOrderId: (
    orderId: OrderId
  ) => Effect.Effect<ReadonlyArray<OrderItem>, PersistenceError>;
}

export class OrderItemRepository extends ServiceMap.Service<
  OrderItemRepository,
  OrderItemRepositoryService
>()("@starter/persistence/Services/OrderItemRepository") {}
