import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import type { Todo } from "@starter/core/todo/Todo";
import type { TodoId } from "@starter/core/todo/TodoId";
import type { CreateTodoInput } from "@starter/core/todo/CreateTodoInput";
import type { UpdateTodoInput } from "@starter/core/todo/UpdateTodoInput";
import type {
  EntityNotFoundError,
  PersistenceError,
} from "../Errors/RepositoryError.ts";

export interface TodoRepositoryService {
  readonly list: () => Effect.Effect<ReadonlyArray<Todo>, PersistenceError>;
  readonly getById: (
    id: TodoId
  ) => Effect.Effect<Todo, EntityNotFoundError | PersistenceError>;
  readonly create: (
    input: CreateTodoInput
  ) => Effect.Effect<Todo, PersistenceError>;
  readonly update: (
    id: TodoId,
    input: UpdateTodoInput
  ) => Effect.Effect<Todo, EntityNotFoundError | PersistenceError>;
  readonly remove: (
    id: TodoId
  ) => Effect.Effect<void, EntityNotFoundError | PersistenceError>;
}

export class TodoRepository extends Context.Tag(
  "@starter/persistence/Services/TodoRepository"
)<TodoRepository, TodoRepositoryService>() {}
