import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as SqlSchema from "effect/unstable/sql/SqlSchema";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { Address } from "@starter/core/address/Address";
import { AddressId } from "@starter/core/address/AddressId";
import { AddressRow } from "../Schema/AddressRow.ts";
import {
  AddressRepository,
  type AddressRepositoryService,
} from "../Services/AddressRepository.ts";
import {
  EntityNotFoundError,
  wrapSqlError,
  wrapSqlErrorKeepNotFound,
} from "../Errors/RepositoryError.ts";

const FindByIdRequest = Schema.Struct({ id: Schema.String });

const CreateRequest = Schema.Struct({
  full_name: Schema.String,
  line1: Schema.String,
  line2: Schema.NullOr(Schema.String),
  city: Schema.String,
  state: Schema.String,
  postal_code: Schema.String,
  country: Schema.String,
  phone: Schema.NullOr(Schema.String),
});

const addressRowToDomain = (row: AddressRow): Address =>
  new Address({
    id: AddressId.makeUnsafe(row.id),
    fullName: row.full_name,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const findById = SqlSchema.findOneOption({
    Request: FindByIdRequest,
    Result: AddressRow,
    execute: ({ id }) => sql`
      SELECT * FROM address WHERE id = ${id}
    `,
  });

  const insertOne = SqlSchema.findOneOption({
    Request: CreateRequest,
    Result: AddressRow,
    execute: ({
      full_name,
      line1,
      line2,
      city,
      state,
      postal_code,
      country,
      phone,
    }) => sql`
      INSERT INTO address (full_name, line1, line2, city, state, postal_code, country, phone)
      VALUES (${full_name}, ${line1}, ${line2}, ${city}, ${state}, ${postal_code}, ${country}, ${phone})
      RETURNING *
    `,
  });

  const create: AddressRepositoryService["create"] = (input) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* insertOne({
        full_name: input.fullName,
        line1: input.line1,
        line2: input.line2,
        city: input.city,
        state: input.state,
        postal_code: input.postalCode,
        country: input.country,
        phone: input.phone,
      });
      return yield* Option.match(maybeRow, {
        onNone: () => Effect.die("INSERT RETURNING returned no rows"),
        onSome: (row) => Effect.succeed(addressRowToDomain(row)),
      });
    });
    return pipe(effect, wrapSqlError("AddressRepository.create"));
  };

  const getById: AddressRepositoryService["getById"] = (id) => {
    const effect = Effect.gen(function* () {
      const maybeRow = yield* findById({ id });
      return yield* Option.match(maybeRow, {
        onNone: () =>
          Effect.fail(
            new EntityNotFoundError({
              entityType: "Address",
              entityId: id,
            })
          ),
        onSome: (row) => Effect.succeed(addressRowToDomain(row)),
      });
    });
    return pipe(effect, wrapSqlErrorKeepNotFound("AddressRepository.getById"));
  };

  return {
    create,
    getById,
  } satisfies AddressRepositoryService;
});

export const AddressRepositoryLive = Layer.effect(AddressRepository)(make);
