import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as SqlSchema from "effect/unstable/sql/SqlSchema";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { OrderId } from "@starter/core/order/OrderId";
import { Email } from "@starter/core/shared/values/Email";
import { EmailLogId } from "@starter/core/shared/values/EmailLogId";
import {
  EmailLogRepository,
  type EmailLogRepositoryService,
  type EmailLog,
} from "../Services/EmailLogRepository.ts";
import { wrapSqlError } from "../Errors/RepositoryError.ts";

const EmailLogRow = Schema.Struct({
  id: Schema.String,
  order_id: Schema.String,
  email_type: Schema.String,
  recipient_email: Schema.String,
  sent_at: Schema.Date,
});

type EmailLogRow = typeof EmailLogRow.Type;

const InsertRequest = Schema.Struct({
  order_id: Schema.String,
  email_type: Schema.String,
  recipient_email: Schema.String,
});

const ByOrderIdRequest = Schema.Struct({
  order_id: Schema.String,
});

const rowToDomain = (row: EmailLogRow): EmailLog => ({
  id: EmailLogId.makeUnsafe(row.id),
  orderId: OrderId.makeUnsafe(row.order_id),
  emailType: row.email_type,
  recipientEmail: Email.makeUnsafe(row.recipient_email),
  sentAt: row.sent_at,
});

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const insertOne = SqlSchema.findOneOption({
    Request: InsertRequest,
    Result: EmailLogRow,
    execute: ({ order_id, email_type, recipient_email }) => sql`
      INSERT INTO email_log (order_id, email_type, recipient_email)
      VALUES (${order_id}, ${email_type}, ${recipient_email})
      RETURNING *
    `,
  });

  const findByOrderId = SqlSchema.findAll({
    Request: ByOrderIdRequest,
    Result: EmailLogRow,
    execute: ({ order_id }) => sql`
      SELECT * FROM email_log WHERE order_id = ${order_id} ORDER BY sent_at DESC
    `,
  });

  const log: EmailLogRepositoryService["log"] = (
    orderId,
    emailType,
    recipientEmail
  ) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* insertOne({
        order_id: orderId,
        email_type: emailType,
        recipient_email: recipientEmail,
      });
      return yield* Option.match(maybeRow, {
        onNone: () => Effect.die("INSERT RETURNING returned no rows"),
        onSome: (row) => Effect.succeed(rowToDomain(row)),
      });
    });
    return pipe(effect, wrapSqlError("EmailLogRepository.log"));
  };

  const getByOrderId: EmailLogRepositoryService["getByOrderId"] = (orderId) => {
    const effect = Effect.gen(function* () {
      const rows = yield* findByOrderId({ order_id: orderId });
      return rows.map(rowToDomain);
    });
    return pipe(effect, wrapSqlError("EmailLogRepository.getByOrderId"));
  };

  return { log, getByOrderId } satisfies EmailLogRepositoryService;
});

export const EmailLogRepositoryLive = Layer.effect(EmailLogRepository)(make);
