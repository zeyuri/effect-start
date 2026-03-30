import * as ServiceMap from "effect/ServiceMap";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import type { OrderId } from "@starter/core/order/OrderId";
import type { ProductVariantId } from "@starter/core/product/ProductVariantId";
import type { DownloadTokenId } from "@starter/core/shared/values/DownloadTokenId";
import type { PersistenceError } from "../Errors/RepositoryError.ts";

export interface DownloadToken {
  readonly id: DownloadTokenId;
  readonly orderId: OrderId;
  readonly productVariantId: ProductVariantId;
  readonly token: string;
  readonly usedAt: Date | null;
  readonly expiresAt: Date;
}

export interface DownloadTokenRepositoryService {
  readonly create: (
    orderId: OrderId,
    productVariantId: ProductVariantId,
    token: string,
    expiresAt: Date
  ) => Effect.Effect<DownloadToken, PersistenceError>;
  readonly getByToken: (
    token: string
  ) => Effect.Effect<Option.Option<DownloadToken>, PersistenceError>;
  readonly markUsed: (
    id: DownloadTokenId
  ) => Effect.Effect<void, PersistenceError>;
}

export class DownloadTokenRepository extends ServiceMap.Service<
  DownloadTokenRepository,
  DownloadTokenRepositoryService
>()("@starter/persistence/Services/DownloadTokenRepository") {}
