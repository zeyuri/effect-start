import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import { ApiLive } from "./api";
import { ApiClientLive } from "./api-client";

export const AppLayer = pipe(
  ApiLive,
  Layer.provide(ApiClientLive),
  Layer.provide(FetchHttpClient.layer)
);
