import * as ServiceMap from "effect/ServiceMap";
import * as Effect from "effect/Effect";
import type { Order } from "@starter/core/order/Order";
import type { OrderId } from "@starter/core/order/OrderId";
import type { OrderStatus } from "@starter/core/order/OrderStatus";
import type { ProductId } from "@starter/core/product/ProductId";
import type { CustomerId } from "@starter/core/customer/CustomerId";
import type { CartId } from "@starter/core/cart/CartId";
import type { Email } from "@starter/core/shared/values/Email";
import type {
  EntityNotFoundError,
  PersistenceError,
} from "../Errors/RepositoryError.ts";

export interface OrderRepositoryService {
  /** Legacy single-product create */
  readonly create: (input: {
    readonly productId: ProductId;
    readonly buyerName: string;
    readonly buyerEmail: Email;
    readonly pixKey: string;
  }) => Effect.Effect<Order, PersistenceError>;
  /** Cart-based multi-item create */
  readonly createFromCart: (input: {
    readonly cartId: CartId;
    readonly customerId: CustomerId | null;
    readonly buyerName: string;
    readonly buyerEmail: Email;
    readonly subtotalCents: number;
    readonly shippingCents: number;
    readonly totalCents: number;
    readonly currency: string;
  }) => Effect.Effect<Order, PersistenceError>;
  readonly getById: (
    id: OrderId
  ) => Effect.Effect<Order, EntityNotFoundError | PersistenceError>;
  readonly markPaid: (
    id: OrderId
  ) => Effect.Effect<Order, EntityNotFoundError | PersistenceError>;
  readonly updateStatus: (
    id: OrderId,
    status: OrderStatus
  ) => Effect.Effect<Order, EntityNotFoundError | PersistenceError>;
  readonly listAll: () => Effect.Effect<ReadonlyArray<Order>, PersistenceError>;
  readonly listByBuyerEmail: (
    email: Email
  ) => Effect.Effect<ReadonlyArray<Order>, PersistenceError>;
  readonly countByStatus: () => Effect.Effect<
    ReadonlyArray<{ readonly status: string; readonly count: number }>,
    PersistenceError
  >;
  readonly totalRevenue: () => Effect.Effect<number, PersistenceError>;
}

export class OrderRepository extends ServiceMap.Service<
  OrderRepository,
  OrderRepositoryService
>()("@starter/persistence/Services/OrderRepository") {}
