import * as Schema from "effect/Schema";

export const EmailLogId = Schema.String.pipe(Schema.brand("EmailLogId"));
export type EmailLogId = typeof EmailLogId.Type;
