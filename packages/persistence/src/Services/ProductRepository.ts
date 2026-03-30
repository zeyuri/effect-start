import * as ServiceMap from "effect/ServiceMap";
import * as Effect from "effect/Effect";
import type { Product } from "@starter/core/product/Product";
import type { ProductId } from "@starter/core/product/ProductId";
import type {
  EntityNotFoundError,
  PersistenceError,
} from "../Errors/RepositoryError.ts";

export interface ProductRepositoryService {
  readonly list: () => Effect.Effect<ReadonlyArray<Product>, PersistenceError>;
  readonly getById: (
    id: ProductId
  ) => Effect.Effect<Product, EntityNotFoundError | PersistenceError>;
  readonly create: (input: {
    readonly name: string;
    readonly description: string;
    readonly imageUrl: string;
    readonly priceCents: number;
  }) => Effect.Effect<Product, PersistenceError>;
  readonly update: (
    id: ProductId,
    input: {
      readonly name?: string;
      readonly description?: string;
      readonly imageUrl?: string;
      readonly priceCents?: number;
    }
  ) => Effect.Effect<Product, EntityNotFoundError | PersistenceError>;
  /** Soft-delete: sets is_active = false */
  readonly remove: (
    id: ProductId
  ) => Effect.Effect<void, EntityNotFoundError | PersistenceError>;
}

export class ProductRepository extends ServiceMap.Service<
  ProductRepository,
  ProductRepositoryService
>()("@starter/persistence/Services/ProductRepository") {}
