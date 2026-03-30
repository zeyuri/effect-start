import * as ServiceMap from "effect/ServiceMap";
import * as Effect from "effect/Effect";
import type { PersistenceError } from "../Errors/RepositoryError.ts";

export type ShippingQuoteStatus = "quoted" | "selected" | "expired";

export interface ShippingQuote {
  readonly id: string;
  readonly orderId: string;
  readonly carrier: string;
  readonly service: string;
  readonly priceCents: number;
  readonly currency: string;
  readonly estimatedDays: number | null;
  readonly status: ShippingQuoteStatus;
  readonly expiresAt: Date | null;
  readonly selectedAt: Date | null;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Date;
}

export interface ShippingQuoteRepositoryService {
  /**
   * Delete expired shipping quotes older than the retention window.
   * Retention policy: quotes with status 'quoted' whose expires_at
   * is before the cutoff date are removed. Quotes with status 'selected'
   * are never cleaned up (they are part of order history).
   *
   * Default retention: 7 days past expiration.
   *
   * @returns the number of deleted rows
   */
  readonly deleteExpired: (
    retentionDays?: number
  ) => Effect.Effect<number, PersistenceError>;
}

export class ShippingQuoteRepository extends ServiceMap.Service<
  ShippingQuoteRepository,
  ShippingQuoteRepositoryService
>()("@starter/persistence/Services/ShippingQuoteRepository") {}
