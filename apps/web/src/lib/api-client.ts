import { AppApi } from "@starter/api-contract/AppApi";
import * as HttpApiClient from "@effect/platform/HttpApiClient";
import * as HttpClient from "@effect/platform/HttpClient";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Schedule from "effect/Schedule";

const getBaseUrl = (): string => "http://localhost:3000";

const apiClient = Effect.gen(function* () {
  const http = yield* HttpApiClient.make(AppApi, {
    baseUrl: getBaseUrl(),
    transformClient: (client) =>
      pipe(
        client,
        HttpClient.filterStatusOk,
        HttpClient.retryTransient({
          times: 3,
          schedule: Schedule.exponential("1 second"),
        })
      ),
  });

  return { http };
});

type ApiClientShape = Effect.Effect.Success<typeof apiClient>;

export class ApiClient extends Context.Tag(
  "@starter/web/lib/api-client/ApiClient"
)<ApiClient, ApiClientShape>() {}

export const ApiClientLive = Layer.scoped(ApiClient, apiClient);
