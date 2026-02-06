import * as HttpApi from "@effect/platform/HttpApi";
import { TodosApiGroup } from "./TodosApi.js";

export class AppApi extends HttpApi.make("app")
  .add(TodosApiGroup)
  .prefix("/api") {}
