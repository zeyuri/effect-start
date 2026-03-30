import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as SqlSchema from "effect/unstable/sql/SqlSchema";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import * as DateTime from "effect/DateTime";
import { Todo } from "@starter/core/todo/Todo";
import { TodoId } from "@starter/core/todo/TodoId";
import type { UpdateTodoInput } from "@starter/core/todo/UpdateTodoInput";
import { TodoRow } from "../Schema/TodoRow.ts";
import {
  TodoRepository,
  type TodoRepositoryService,
} from "../Services/TodoRepository.ts";
import {
  EntityNotFoundError,
  wrapSqlError,
  wrapSqlErrorKeepNotFound,
} from "../Errors/RepositoryError.ts";

const FindByIdRequest = Schema.Struct({ id: Schema.String });
const EmptyRequest = Schema.Struct({});
const CreateRequest = Schema.Struct({
  title: Schema.String,
});

const todoRowToDomain = (row: TodoRow): Todo =>
  new Todo({
    id: TodoId.makeUnsafe(row.id),
    title: row.title,
    completed: row.completed,
    createdAt: DateTime.fromDateUnsafe(row.created_at),
  });

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const findById = SqlSchema.findOneOption({
    Request: FindByIdRequest,
    Result: TodoRow,
    execute: ({ id }) => sql`
      SELECT * FROM todo WHERE id = ${id}
    `,
  });

  const insertOne = SqlSchema.findOneOption({
    Request: CreateRequest,
    Result: TodoRow,
    execute: ({ title }) => sql`
      INSERT INTO todo (title)
      VALUES (${title})
      RETURNING *
    `,
  });

  const listAll = SqlSchema.findAll({
    Request: EmptyRequest,
    Result: TodoRow,
    execute: () => sql`
      SELECT * FROM todo ORDER BY created_at DESC
    `,
  });

  const list: TodoRepositoryService["list"] = () => {
    const effect = Effect.gen(function* () {
      const rows = yield* listAll({});
      return rows.map(todoRowToDomain);
    });
    return pipe(effect, wrapSqlError("TodoRepository.list"));
  };

  const getById: TodoRepositoryService["getById"] = (id) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* findById({ id });
      const row = yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "Todo",
              entityId: id,
            })
          ),
        onSome: Effect.succeed,
      });
      return todoRowToDomain(row);
    });
    return pipe(effect, wrapSqlErrorKeepNotFound("TodoRepository.getById"));
  };

  const create: TodoRepositoryService["create"] = (input) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* insertOne({
        title: input.title,
      });
      return yield* Option.match(maybeRow, {
        onNone: () => Effect.die("INSERT RETURNING returned no rows"),
        onSome: (row) => Effect.succeed(todoRowToDomain(row)),
      });
    });
    return pipe(effect, wrapSqlError("TodoRepository.create"));
  };

  const update: TodoRepositoryService["update"] = (
    id,
    input: UpdateTodoInput
  ) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* findById({ id });
      const existing = yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "Todo",
              entityId: id,
            })
          ),
        onSome: Effect.succeed,
      });

      const newTitle = input.title !== undefined
        ? Option.getOrElse(input.title, () => existing.title)
        : existing.title;
      const newCompleted = input.completed !== undefined
        ? Option.getOrElse(input.completed, () => existing.completed)
        : existing.completed;

      const UpdateRequest = Schema.Struct({
        id: Schema.String,
        title: Schema.String,
        completed: Schema.Boolean,
      });

      const updateOne = SqlSchema.findOneOption({
        Request: UpdateRequest,
        Result: TodoRow,
        execute: ({ id: todoId, title, completed }) => sql`
          UPDATE todo
          SET title = ${title}, completed = ${completed}
          WHERE id = ${todoId}
          RETURNING *
        `,
      });

      const maybeUpdated = yield* updateOne({
        id,
        title: newTitle,
        completed: newCompleted,
      });

      return yield* Option.match(maybeUpdated, {
        onNone: () => Effect.die("UPDATE RETURNING returned no rows"),
        onSome: (row) => Effect.succeed(todoRowToDomain(row)),
      });
    });
    return pipe(effect, wrapSqlErrorKeepNotFound("TodoRepository.update"));
  };

  const remove: TodoRepositoryService["remove"] = (id) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* findById({ id });
      yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "Todo",
              entityId: id,
            })
          ),
        onSome: Effect.succeed,
      });

      const DeleteRequest = Schema.Struct({
        id: Schema.String,
      });
      const deleteOne = SqlSchema.void({
        Request: DeleteRequest,
        execute: ({ id: todoId }) => sql`
          DELETE FROM todo WHERE id = ${todoId}
        `,
      });
      yield* deleteOne({ id });
    });
    return pipe(effect, wrapSqlErrorKeepNotFound("TodoRepository.remove"));
  };

  return {
    list,
    getById,
    create,
    update,
    remove,
  } satisfies TodoRepositoryService;
});

export const TodoRepositoryLive = Layer.effect(TodoRepository)(make);
