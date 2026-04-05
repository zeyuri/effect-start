import * as Atom from "effect/unstable/reactivity/Atom";
import { AppApi } from "@starter/api-contract/AppApi";
import * as HttpApiClient from "effect/unstable/httpapi/HttpApiClient";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import * as ServiceMap from "effect/ServiceMap";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Schedule from "effect/Schedule";

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

const apiClient = Effect.gen(function* () {
  const http = yield* HttpApiClient.make(AppApi, {
    baseUrl,
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

type AdminApiClientShape = Effect.Success<typeof apiClient>;

export class AdminApiClient extends ServiceMap.Service<
  AdminApiClient,
  AdminApiClientShape
>()("@starter/admin/lib/runtime/AdminApiClient") {}

const AdminApiClientLive = Layer.effect(AdminApiClient)(apiClient);

const AppLayer = pipe(AdminApiClientLive, Layer.provide(FetchHttpClient.layer));

export const atomRuntime = Atom.runtime(AppLayer);
