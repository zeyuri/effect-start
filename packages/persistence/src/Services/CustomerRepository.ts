import * as ServiceMap from "effect/ServiceMap";
import * as Effect from "effect/Effect";
import type { Customer } from "@starter/core/customer/Customer";
import type { CustomerId } from "@starter/core/customer/CustomerId";
import type { Email } from "@starter/core/shared/values/Email";
import type { AddressId } from "@starter/core/address/AddressId";
import type {
  EntityNotFoundError,
  PersistenceError,
} from "../Errors/RepositoryError.ts";

export interface CustomerRepositoryService {
  readonly create: (input: {
    readonly email: Email;
    readonly name: string;
  }) => Effect.Effect<Customer, PersistenceError>;
  readonly getById: (
    id: CustomerId
  ) => Effect.Effect<Customer, EntityNotFoundError | PersistenceError>;
  readonly getByEmail: (
    email: Email
  ) => Effect.Effect<Customer, EntityNotFoundError | PersistenceError>;
  readonly listAll: () => Effect.Effect<
    ReadonlyArray<Customer>,
    PersistenceError
  >;
  readonly updateDefaultAddress: (
    id: CustomerId,
    addressId: AddressId | null
  ) => Effect.Effect<Customer, EntityNotFoundError | PersistenceError>;
}

export class CustomerRepository extends ServiceMap.Service<
  CustomerRepository,
  CustomerRepositoryService
>()("@starter/persistence/Services/CustomerRepository") {}
