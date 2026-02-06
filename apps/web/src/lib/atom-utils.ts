import { Atom, type Hydration } from "@effect-atom/atom-react";
import type * as Schema from "effect/Schema";

export type TypedSerializable<A, I> = Atom.Serializable<Schema.Schema<A, I>>;

export const serializable = Atom.serializable;

export type SerializableDehydratedAtom = Hydration.DehydratedAtom & {
  readonly key: string;
  readonly value: {};
  readonly dehydratedAt: number;
};

export const dehydrate = <A, I extends {}>(
  atom: Atom.Atom<A> & TypedSerializable<A, I>,
  value: A
): SerializableDehydratedAtom => ({
  "~@effect-atom/atom/DehydratedAtom": true,
  key: atom[Atom.SerializableTypeId].key,
  value: atom[Atom.SerializableTypeId].encode(value),
  dehydratedAt: Date.now(),
});
