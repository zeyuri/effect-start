import * as ServiceMap from "effect/ServiceMap";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import type { ProductId } from "@starter/core/product/ProductId";
import type { ProductVariantId } from "@starter/core/product/ProductVariantId";
import type { ProductVariantRow } from "../Schema/ProductVariantRow.ts";
import type {
  InsufficientStockError,
  PersistenceError,
} from "../Errors/RepositoryError.ts";

export interface ProductVariantRepositoryService {
  readonly getById: (
    id: ProductVariantId
  ) => Effect.Effect<Option.Option<ProductVariantRow>, PersistenceError>;
  readonly listActiveByProductId: (
    productId: ProductId
  ) => Effect.Effect<ReadonlyArray<ProductVariantRow>, PersistenceError>;
  readonly listActiveByProductIds: (
    productIds: ReadonlyArray<ProductId>
  ) => Effect.Effect<ReadonlyArray<ProductVariantRow>, PersistenceError>;
  /** Check if requested quantity is available (null stock = unlimited) */
  readonly checkStock: (
    id: ProductVariantId,
    quantity: number
  ) => Effect.Effect<void, InsufficientStockError | PersistenceError>;
  /** Atomically decrement stock; no-op for null (unlimited) stock */
  readonly decrementStock: (
    items: ReadonlyArray<{
      readonly productVariantId: ProductVariantId;
      readonly quantity: number;
    }>
  ) => Effect.Effect<void, InsufficientStockError | PersistenceError>;
  /** Update variant fields (name, price, stock, dimensions) */
  readonly update: (
    id: ProductVariantId,
    input: {
      readonly name?: string;
      readonly priceCents?: number;
      readonly stock?: number | null;
      readonly weightGrams?: number | null;
      readonly lengthCm?: string | null;
      readonly widthCm?: string | null;
      readonly heightCm?: string | null;
    }
  ) => Effect.Effect<ProductVariantRow, PersistenceError>;
  /** Restore stock after cancellation; no-op for null (unlimited) stock */
  readonly restoreStock: (
    items: ReadonlyArray<{
      readonly productVariantId: ProductVariantId;
      readonly quantity: number;
    }>
  ) => Effect.Effect<void, PersistenceError>;
  /** Find active variants with finite stock at or below a threshold */
  readonly findLowStock: (
    threshold: number
  ) => Effect.Effect<ReadonlyArray<ProductVariantRow>, PersistenceError>;
}

export class ProductVariantRepository extends ServiceMap.Service<
  ProductVariantRepository,
  ProductVariantRepositoryService
>()("@starter/persistence/Services/ProductVariantRepository") {}
