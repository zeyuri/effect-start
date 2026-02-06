import { pipe } from "effect/Function";
import * as Schema from "effect/Schema";

export const TodoId = pipe(Schema.String, Schema.brand("TodoId"));
export type TodoId = typeof TodoId.Type;
