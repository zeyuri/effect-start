import * as HttpApiEndpoint from "effect/unstable/httpapi/HttpApiEndpoint";
import * as HttpApiGroup from "effect/unstable/httpapi/HttpApiGroup";
import {
  AddCartItemPayload,
  Cart,
  CartId,
  CartItem,
  CartItemId,
  CartItemNotFound,
  CartNotFound,
  CreateCartPayload,
  InsufficientStock,
  UpdateCartItemPayload,
} from "./CartSchema.js";

export class CartsApiGroup extends HttpApiGroup.make("carts")
  .add(
    HttpApiEndpoint.post("create", "/carts", {
      payload: CreateCartPayload,
      success: Cart.annotate({ httpApiStatus: 201 }),
    })
  )
  .add(
    HttpApiEndpoint.get("getById", "/carts/:id", {
      params: { id: CartId },
      success: Cart,
      error: CartNotFound,
    })
  )
  .add(
    HttpApiEndpoint.post("addItem", "/carts/:id/items", {
      params: { id: CartId },
      payload: AddCartItemPayload,
      success: CartItem.annotate({ httpApiStatus: 201 }),
      error: [CartNotFound, InsufficientStock],
    })
  )
  .add(
    HttpApiEndpoint.patch("updateItem", "/carts/:cartId/items/:itemId", {
      params: { cartId: CartId, itemId: CartItemId },
      payload: UpdateCartItemPayload,
      success: CartItem,
      error: [CartNotFound, CartItemNotFound, InsufficientStock],
    })
  )
  .add(
    HttpApiEndpoint.delete("removeItem", "/carts/:cartId/items/:itemId", {
      params: { cartId: CartId, itemId: CartItemId },
      error: [CartNotFound, CartItemNotFound],
    })
  ) {}
