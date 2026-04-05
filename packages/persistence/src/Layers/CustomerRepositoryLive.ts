import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as SqlSchema from "effect/unstable/sql/SqlSchema";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { Customer } from "@starter/core/customer/Customer";
import { CustomerId } from "@starter/core/customer/CustomerId";
import { AddressId } from "@starter/core/address/AddressId";
import { Email } from "@starter/core/shared/values/Email";
import { CustomerRow } from "../Schema/CustomerRow.ts";
import {
  CustomerRepository,
  type CustomerRepositoryService,
} from "../Services/CustomerRepository.ts";
import {
  EntityNotFoundError,
  wrapSqlError,
  wrapSqlErrorKeepNotFound,
} from "../Errors/RepositoryError.ts";

const FindByIdRequest = Schema.Struct({ id: Schema.String });
const FindByEmailRequest = Schema.Struct({ email: Schema.String });

const CreateRequest = Schema.Struct({
  email: Schema.String,
  name: Schema.String,
});

const UpdateDefaultAddressRequest = Schema.Struct({
  id: Schema.String,
  default_address_id: Schema.NullOr(Schema.String),
});

const customerRowToDomain = (row: CustomerRow): Customer =>
  new Customer({
    id: CustomerId.makeUnsafe(row.id),
    email: Email.makeUnsafe(row.email),
    name: row.name,
    defaultAddressId:
      row.default_address_id !== null
        ? AddressId.makeUnsafe(row.default_address_id)
        : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const findById = SqlSchema.findOneOption({
    Request: FindByIdRequest,
    Result: CustomerRow,
    execute: ({ id }) => sql`
      SELECT * FROM customer WHERE id = ${id}
    `,
  });

  const findByEmail = SqlSchema.findOneOption({
    Request: FindByEmailRequest,
    Result: CustomerRow,
    execute: ({ email }) => sql`
      SELECT * FROM customer WHERE lower(email) = lower(${email})
    `,
  });

  const insertOne = SqlSchema.findOneOption({
    Request: CreateRequest,
    Result: CustomerRow,
    execute: ({ email, name }) => sql`
      INSERT INTO customer (email, name)
      VALUES (${email}, ${name})
      RETURNING *
    `,
  });

  const updateDefaultAddressQuery = SqlSchema.findOneOption({
    Request: UpdateDefaultAddressRequest,
    Result: CustomerRow,
    execute: ({ id, default_address_id }) => sql`
      UPDATE customer
      SET default_address_id = ${default_address_id}, updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `,
  });

  const create: CustomerRepositoryService["create"] = (input) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* insertOne({
        email: input.email,
        name: input.name,
      });
      return yield* Option.match(maybeRow, {
        onNone: () => Effect.die("INSERT RETURNING returned no rows"),
        onSome: (row) => Effect.succeed(customerRowToDomain(row)),
      });
    });
    return pipe(effect, wrapSqlError("CustomerRepository.create"));
  };

  const getById: CustomerRepositoryService["getById"] = (id) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* findById({ id });
      return yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "Customer",
              entityId: id,
            })
          ),
        onSome: (row) => Effect.succeed(customerRowToDomain(row)),
      });
    });
    return pipe(effect, wrapSqlErrorKeepNotFound("CustomerRepository.getById"));
  };

  const getByEmail: CustomerRepositoryService["getByEmail"] = (email) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* findByEmail({ email });
      return yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "Customer",
              entityId: email,
            })
          ),
        onSome: (row) => Effect.succeed(customerRowToDomain(row)),
      });
    });
    return pipe(
      effect,
      wrapSqlErrorKeepNotFound("CustomerRepository.getByEmail")
    );
  };

  const findAllCustomers = SqlSchema.findAll({
    Request: Schema.Struct({}),
    Result: CustomerRow,
    execute: () => sql`
      SELECT * FROM customer ORDER BY created_at DESC
    `,
  });

  const listAll: CustomerRepositoryService["listAll"] = () => {
    const effect = Effect.gen(function* () {
      const rows = yield* findAllCustomers({});
      return rows.map(customerRowToDomain);
    });
    return pipe(effect, wrapSqlError("CustomerRepository.listAll"));
  };

  const updateDefaultAddress: CustomerRepositoryService["updateDefaultAddress"] =
    (id, addressId) => {
      const effect = Effect.gen(function* () {
        const maybeRow = yield* updateDefaultAddressQuery({
          id,
          default_address_id: addressId,
        });
        return yield* Option.match(maybeRow, {
          onNone: () =>
            Effect.fail(
              new EntityNotFoundError({
                entityType: "Customer",
                entityId: id,
              })
            ),
          onSome: (row) => Effect.succeed(customerRowToDomain(row)),
        });
      });
      return pipe(
        effect,
        wrapSqlErrorKeepNotFound("CustomerRepository.updateDefaultAddress")
      );
    };

  return {
    create,
    getById,
    getByEmail,
    listAll,
    updateDefaultAddress,
  } satisfies CustomerRepositoryService;
});

export const CustomerRepositoryLive = Layer.effect(CustomerRepository)(make);
