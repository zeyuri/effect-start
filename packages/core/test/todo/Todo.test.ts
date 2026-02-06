import { describe, expect, it } from "@effect/vitest";
import * as DateTime from "effect/DateTime";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { CreateTodoInput } from "../../src/todo/CreateTodoInput.ts";
import { Todo } from "../../src/todo/Todo.ts";
import { TodoId } from "../../src/todo/TodoId.ts";
import { UpdateTodoInput } from "../../src/todo/UpdateTodoInput.ts";

describe("Todo", () => {
  it.effect("can be created with Schema.make", () =>
    Effect.gen(function* () {
      const todo = Todo.make({
        id: TodoId.make("test-id"),
        title: "Test todo",
        completed: false,
        createdAt: DateTime.unsafeNow(),
      });
      expect(todo.title).toBe("Test todo");
      expect(todo.completed).toBe(false);
    }),
  );

  it.effect("TodoId is a branded string", () =>
    Effect.gen(function* () {
      const decoded = yield* Schema.decode(TodoId)("abc-123");
      expect(decoded).toBe("abc-123");
    }),
  );

  it.effect("CreateTodoInput requires non-empty title", () =>
    Effect.gen(function* () {
      const decoded = yield* Schema.decode(CreateTodoInput)({
        title: "Buy milk",
      });
      expect(decoded.title).toBe("Buy milk");
    }),
  );

  it.effect("UpdateTodoInput has optional fields", () =>
    Effect.gen(function* () {
      const decoded = yield* Schema.decode(UpdateTodoInput)({});
      expect(decoded).toBeDefined();
    }),
  );
});
