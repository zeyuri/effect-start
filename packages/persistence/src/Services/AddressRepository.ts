import * as ServiceMap from "effect/ServiceMap";
import * as Effect from "effect/Effect";
import type { Address } from "@starter/core/address/Address";
import type { AddressId } from "@starter/core/address/AddressId";
import type {
  EntityNotFoundError,
  PersistenceError,
} from "../Errors/RepositoryError.ts";

export interface AddressRepositoryService {
  readonly create: (input: {
    readonly fullName: string;
    readonly line1: string;
    readonly line2: string | null;
    readonly city: string;
    readonly state: string;
    readonly postalCode: string;
    readonly country: string;
    readonly phone: string | null;
  }) => Effect.Effect<Address, PersistenceError>;
  readonly getById: (
    id: AddressId
  ) => Effect.Effect<Address, EntityNotFoundError | PersistenceError>;
}

export class AddressRepository extends ServiceMap.Service<
  AddressRepository,
  AddressRepositoryService
>()("@starter/persistence/Services/AddressRepository") {}
