import { AtomHttpApi } from "@effect-atom/atom-react";
import { AppApi } from "@starter/api-contract/AppApi";
import * as FetchHttpClient from "@effect/platform/FetchHttpClient";

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

const makeAdminApi = AtomHttpApi.Tag<"AdminApi">();

export const AdminApi = makeAdminApi("@starter/admin/lib/runtime/AdminApi", {
  api: AppApi,
  httpClient: FetchHttpClient.layer,
  baseUrl,
});
