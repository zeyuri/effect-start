import { AppApi } from "@starter/api-contract/AppApi";
import * as HttpApiClient from "effect/unstable/httpapi/HttpApiClient";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as ServiceMap from "effect/ServiceMap";
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

type ApiClientShape = Effect.Success<typeof apiClient>;

export class ApiClient extends ServiceMap.Service<ApiClient, ApiClientShape>()(
  "@starter/web/lib/api-client/ApiClient"
) {}

export const ApiClientLive = Layer.effect(ApiClient)(apiClient);
