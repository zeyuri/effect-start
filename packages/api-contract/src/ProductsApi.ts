import * as HttpApiEndpoint from "effect/unstable/httpapi/HttpApiEndpoint";
import * as HttpApiGroup from "effect/unstable/httpapi/HttpApiGroup";
import * as Schema from "effect/Schema";
import {
  CreateProductPayload,
  InvalidProduct,
  Product,
  ProductId,
  ProductNotFound,
} from "./ProductSchema.js";

export class ProductsApiGroup extends HttpApiGroup.make("products")
  .add(
    HttpApiEndpoint.get("list", "/products", {
      success: Schema.Array(Product),
    })
  )
  .add(
    HttpApiEndpoint.get("getById", "/products/:id", {
      params: { id: ProductId },
      success: Product,
      error: ProductNotFound,
    })
  )
  .add(
    HttpApiEndpoint.post("create", "/products", {
      payload: CreateProductPayload,
      success: Product.annotate({ httpApiStatus: 201 }),
      error: InvalidProduct,
    })
  ) {}
