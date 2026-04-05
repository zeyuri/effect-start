import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import { OrderRepositoryLive } from "./OrderRepositoryLive.ts";
import { ProductRepositoryLive } from "./ProductRepositoryLive.ts";
import { ProductVariantRepositoryLive } from "./ProductVariantRepositoryLive.ts";
import { EmailLogRepositoryLive } from "./EmailLogRepositoryLive.ts";
import { DownloadTokenRepositoryLive } from "./DownloadTokenRepositoryLive.ts";
import { CartRepositoryLive } from "./CartRepositoryLive.ts";
import { CustomerRepositoryLive } from "./CustomerRepositoryLive.ts";
import { AddressRepositoryLive } from "./AddressRepositoryLive.ts";
import { OrderAddressRepositoryLive } from "./OrderAddressRepositoryLive.ts";
import { OrderItemRepositoryLive } from "./OrderItemRepositoryLive.ts";
import { PaymentRepositoryLive } from "./PaymentRepositoryLive.ts";
import { WebhookEventRepositoryLive } from "./WebhookEventRepositoryLive.ts";
import { FulfillmentRepositoryLive } from "./FulfillmentRepositoryLive.ts";
import { ShippingQuoteRepositoryLive } from "./ShippingQuoteRepositoryLive.ts";
import { TodoRepositoryLive } from "./TodoRepositoryLive.ts";

export const RepositoriesLive = pipe(
  ProductRepositoryLive,
  Layer.provideMerge(ProductVariantRepositoryLive),
  Layer.provideMerge(OrderRepositoryLive),
  Layer.provideMerge(EmailLogRepositoryLive),
  Layer.provideMerge(DownloadTokenRepositoryLive),
  Layer.provideMerge(CartRepositoryLive),
  Layer.provideMerge(CustomerRepositoryLive),
  Layer.provideMerge(AddressRepositoryLive),
  Layer.provideMerge(OrderAddressRepositoryLive),
  Layer.provideMerge(OrderItemRepositoryLive),
  Layer.provideMerge(PaymentRepositoryLive),
  Layer.provideMerge(WebhookEventRepositoryLive),
  Layer.provideMerge(FulfillmentRepositoryLive),
  Layer.provideMerge(ShippingQuoteRepositoryLive),
  Layer.provideMerge(TodoRepositoryLive)
);
