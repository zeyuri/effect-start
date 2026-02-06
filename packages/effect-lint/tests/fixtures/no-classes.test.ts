import { Context, Data, Schema, HttpApiGroup, HttpApi } from "effect";

// --- Violations (should trigger the rule) ---

// eslint-disable-next-line effect/no-classes
class MyClass {
  value = 42;
}

// eslint-disable-next-line effect/no-classes
class Foo extends SomeOther.thing() {}

// --- Valid: existing allowlist (must NOT trigger) ---

class MyTag extends Context.Tag("MyTag")<MyTag, { value: number }>() {}

class MyError extends Data.TaggedError("MyError") {}

class MySchema extends Schema.Class {}

// --- Valid: NEW additions (must NOT trigger) ---

class MyTaggedError extends Schema.TaggedError<MyTaggedError>()("MyTaggedError", {}) {}

class MyGroup extends HttpApiGroup.make("g").add(HttpApiGroup.endpoint("e")) {}

class MyApi extends HttpApi.make("a").add(HttpApiGroup.make("g")).prefix("/api") {}
