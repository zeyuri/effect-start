import * as Atom from "effect/unstable/reactivity/Atom";
import type * as Hydration from "effect/unstable/reactivity/Hydration";
import type * as Schema from "effect/Schema";

export type TypedSerializable<A, I> = Atom.Serializable<Schema.Codec<A, I>>;

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
  "~effect/reactivity/DehydratedAtom": true,
  key: atom[Atom.SerializableTypeId].key,
  value: atom[Atom.SerializableTypeId].encode(value) as {},
  dehydratedAt: Date.now(),
});
