import * as ServiceMap from "effect/ServiceMap";
import * as Effect from "effect/Effect";
import type { Cart } from "@starter/core/cart/Cart";
import type { CartId } from "@starter/core/cart/CartId";
import type { CartItem } from "@starter/core/cart/CartItem";
import type { CartItemId } from "@starter/core/cart/CartItemId";
import type { CustomerId } from "@starter/core/customer/CustomerId";
import type { Email } from "@starter/core/shared/values/Email";
import type { ProductVariantId } from "@starter/core/product/ProductVariantId";
import type {
  EntityNotFoundError,
  PersistenceError,
} from "../Errors/RepositoryError.ts";

export interface CartRepositoryService {
  readonly create: (input: {
    readonly customerId: CustomerId | null;
    readonly email: Email | null;
  }) => Effect.Effect<Cart, PersistenceError>;
  readonly getById: (
    id: CartId
  ) => Effect.Effect<Cart, EntityNotFoundError | PersistenceError>;
  readonly addItem: (input: {
    readonly cartId: CartId;
    readonly productVariantId: ProductVariantId;
    readonly quantity: number;
    readonly unitPriceCents: number;
  }) => Effect.Effect<CartItem, PersistenceError>;
  readonly updateItemQuantity: (
    itemId: CartItemId,
    quantity: number
  ) => Effect.Effect<CartItem, EntityNotFoundError | PersistenceError>;
  readonly removeItem: (
    itemId: CartItemId
  ) => Effect.Effect<void, EntityNotFoundError | PersistenceError>;
  readonly getItemsByCartId: (
    cartId: CartId
  ) => Effect.Effect<ReadonlyArray<CartItem>, PersistenceError>;
  readonly updateStatus: (
    id: CartId,
    status: "active" | "completed" | "abandoned"
  ) => Effect.Effect<Cart, EntityNotFoundError | PersistenceError>;
  /**
   * Delete abandoned carts older than the retention window.
   * Only carts with status 'abandoned' or 'active' that haven't been
   * updated within the retention period are removed.
   * Completed carts are never cleaned up (part of order history).
   *
   * Default retention: 30 days past last update.
   *
   * @returns the number of deleted carts (and their items via CASCADE)
   */
  readonly deleteAbandoned: (
    retentionDays?: number
  ) => Effect.Effect<number, PersistenceError>;
}

export class CartRepository extends ServiceMap.Service<
  CartRepository,
  CartRepositoryService
>()("@starter/persistence/Services/CartRepository") {}
