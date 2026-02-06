import { Schema, Context, Data } from "effect";
import { createFileRoute, createRootRoute } from "@tanstack/react-router";

const MySchema = Schema.Struct({ value: Schema.Number });

// --- Violations (should trigger the rule) ---

// eslint-disable-next-line effect/no-curried-calls
const curriedCall = Schema.decodeUnknown(MySchema)({ value: 42 });

// eslint-disable-next-line effect/no-curried-calls
const plainCurried = someFunction(a)(b);

// eslint-disable-next-line effect/no-curried-calls
const memberCurried = Foo.bar(a)(b);

// --- Valid: existing allowlist (must NOT trigger) ---

const tag = Context.Tag("Foo")();
const error = Data.TaggedError("Foo")({});
const schema = Schema.Class("Foo")({});

// --- Valid: NEW additions (must NOT trigger) ---

const taggedError = Schema.TaggedError<Foo>()("Foo", {});
const route = createFileRoute("/")({});
const rootRoute = createRootRoute()({});
