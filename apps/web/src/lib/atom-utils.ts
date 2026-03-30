import * as Atom from "effect/unstable/reactivity/Atom";
import type * as Hydration from "effect/unstable/reactivity/Hydration";
import type * as Schema from "effect/Schema";

export type TypedSerializable<A, I> = Atom.Serializable<Schema.Codec<A, I>>;

export const serializable = Atom.serializable;

export const dehydrate = <A, I>(
  atom: Atom.Atom<A> & TypedSerializable<A, I>,
  value: A
): Hydration.DehydratedAtomValue => ({
  "~effect/reactivity/DehydratedAtom": true,
  key: atom[Atom.SerializableTypeId].key,
  value: atom[Atom.SerializableTypeId].encode(value),
  dehydratedAt: Date.now(),
});
