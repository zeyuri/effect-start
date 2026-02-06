import * as ManagedRuntime from "effect/ManagedRuntime";
import { AppLayer } from "./app-layer";

export const serverRuntime = ManagedRuntime.make(AppLayer);
