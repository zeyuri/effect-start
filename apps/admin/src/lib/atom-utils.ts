import * as Atom from "effect/unstable/reactivity/Atom";
import type * as Schema from "effect/Schema";

export type TypedSerializable<A, I> = Atom.Serializable<Schema.Codec<A, I>>;

export const serializable = Atom.serializable;
