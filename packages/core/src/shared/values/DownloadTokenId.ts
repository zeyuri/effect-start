import * as Schema from "effect/Schema";

export const DownloadTokenId = Schema.String.pipe(
  Schema.brand("DownloadTokenId")
);
export type DownloadTokenId = typeof DownloadTokenId.Type;
