import * as ServiceMap from "effect/ServiceMap";
import * as Effect from "effect/Effect";
import type { WebhookEvent } from "@starter/core/payment/WebhookEvent";
import type { WebhookEventId } from "@starter/core/payment/WebhookEventId";
import type { WebhookProcessingStatus } from "@starter/core/payment/WebhookProcessingStatus";
import type { PaymentProvider } from "@starter/core/payment/PaymentProvider";
import type {
  EntityNotFoundError,
  PersistenceError,
} from "../Errors/RepositoryError.ts";

export interface WebhookEventRepositoryService {
  /** Insert a new event; returns null if (provider, event_id) already exists */
  readonly insertIfNotExists: (input: {
    readonly provider: PaymentProvider;
    readonly eventId: string;
    readonly eventType: string;
    readonly payload: Record<string, unknown>;
  }) => Effect.Effect<WebhookEvent | null, PersistenceError>;
  readonly getById: (
    id: WebhookEventId
  ) => Effect.Effect<WebhookEvent, EntityNotFoundError | PersistenceError>;
  readonly claimForProcessing: (
    id: WebhookEventId
  ) => Effect.Effect<boolean, PersistenceError>;
  readonly markCompleted: (
    id: WebhookEventId
  ) => Effect.Effect<WebhookEvent, EntityNotFoundError | PersistenceError>;
  readonly markFailed: (
    id: WebhookEventId,
    errorMessage: string
  ) => Effect.Effect<WebhookEvent, EntityNotFoundError | PersistenceError>;
  readonly listByStatus: (
    status: WebhookProcessingStatus
  ) => Effect.Effect<ReadonlyArray<WebhookEvent>, PersistenceError>;
  readonly getByProviderAndEventId: (
    provider: PaymentProvider,
    eventId: string
  ) => Effect.Effect<WebhookEvent | null, PersistenceError>;
  /** List all webhook events ordered by created_at desc, optionally filtered by status */
  readonly listAll: (
    statusFilter?: WebhookProcessingStatus
  ) => Effect.Effect<ReadonlyArray<WebhookEvent>, PersistenceError>;
}

export class WebhookEventRepository extends ServiceMap.Service<
  WebhookEventRepository,
  WebhookEventRepositoryService
>()("@starter/persistence/Services/WebhookEventRepository") {}
