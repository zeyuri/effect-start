import * as ServiceMap from "effect/ServiceMap";
import * as Effect from "effect/Effect";
import type { OrderId } from "@starter/core/order/OrderId";
import type { Email } from "@starter/core/shared/values/Email";
import type { EmailLogId } from "@starter/core/shared/values/EmailLogId";
import type { PersistenceError } from "../Errors/RepositoryError.ts";

export interface EmailLog {
  readonly id: EmailLogId;
  readonly orderId: OrderId;
  readonly emailType: string;
  readonly recipientEmail: Email;
  readonly sentAt: Date;
}

export interface EmailLogRepositoryService {
  readonly log: (
    orderId: OrderId,
    emailType: string,
    recipientEmail: Email
  ) => Effect.Effect<EmailLog, PersistenceError>;
  readonly getByOrderId: (
    orderId: OrderId
  ) => Effect.Effect<ReadonlyArray<EmailLog>, PersistenceError>;
}

export class EmailLogRepository extends ServiceMap.Service<
  EmailLogRepository,
  EmailLogRepositoryService
>()("@starter/persistence/Services/EmailLogRepository") {}
