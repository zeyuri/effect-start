// SQL content is embedded directly to avoid node:fs dependency.
// Source of truth: migrations/0001_init.sql

const migration0001 = `
CREATE TABLE product (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE product_variant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES product(id),
  name text NOT NULL,
  sku text,
  price_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'BRL' CHECK (length(currency) = 3),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_variant_product_id ON product_variant(product_id);
CREATE UNIQUE INDEX idx_product_variant_sku ON product_variant(sku);
`;

const migration0002 = `
CREATE TABLE "order" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES product(id),
  buyer_name text NOT NULL,
  buyer_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  pix_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE INDEX idx_order_product_id ON "order"(product_id);
CREATE INDEX idx_order_status ON "order"(status);
CREATE INDEX idx_order_buyer_email ON "order"(buyer_email);
`;

const migration0003 = `
ALTER TABLE product ADD COLUMN price_cents integer NOT NULL DEFAULT 0;
`;

const migration0004 = `
ALTER TABLE product_variant ADD COLUMN is_digital boolean NOT NULL DEFAULT false;

CREATE TABLE email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES "order"(id),
  email_type varchar(50) NOT NULL,
  recipient_email varchar(255) NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_email_log_order_id ON email_log(order_id);

CREATE TABLE download_token (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES "order"(id),
  product_variant_id uuid NOT NULL REFERENCES product_variant(id),
  token varchar(255) NOT NULL UNIQUE,
  used_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_download_token_token ON download_token(token);
CREATE INDEX idx_download_token_order_id ON download_token(order_id);
`;

const migration0005 = `
CREATE TABLE address (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'BR',
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL,
  default_address_id uuid REFERENCES address(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_customer_email_ci ON customer(lower(email));
CREATE INDEX idx_customer_default_address_id ON customer(default_address_id);

CREATE TABLE cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customer(id) ON DELETE SET NULL,
  email text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','abandoned')),
  metadata jsonb NOT NULL DEFAULT '{}'
    CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cart_customer_id ON cart(customer_id);
CREATE INDEX idx_cart_status ON cart(status);

CREATE TABLE cart_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
  product_variant_id uuid NOT NULL REFERENCES product_variant(id)
    ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_cents bigint NOT NULL CHECK (unit_price_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_cart_item_cart_variant
  ON cart_item(cart_id, product_variant_id);
CREATE INDEX idx_cart_item_product_variant_id
  ON cart_item(product_variant_id);

-- Evolve orders to multi-item
ALTER TABLE "order"
  ADD COLUMN display_id bigint GENERATED ALWAYS AS IDENTITY;
CREATE UNIQUE INDEX idx_order_display_id ON "order"(display_id);

ALTER TABLE "order"
  ADD COLUMN customer_id uuid REFERENCES customer(id) ON DELETE SET NULL,
  ADD COLUMN cart_id uuid REFERENCES cart(id) ON DELETE SET NULL,
  ADD COLUMN subtotal_cents bigint NOT NULL DEFAULT 0
    CHECK (subtotal_cents >= 0),
  ADD COLUMN shipping_cents bigint NOT NULL DEFAULT 0
    CHECK (shipping_cents >= 0),
  ADD COLUMN total_cents bigint NOT NULL DEFAULT 0
    CHECK (total_cents >= 0),
  ADD COLUMN currency text NOT NULL DEFAULT 'BRL'
    CHECK (length(currency) = 3),
  ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'
    CHECK (jsonb_typeof(metadata) = 'object'),
  ADD COLUMN cancelled_at timestamptz;
ALTER TABLE "order" ALTER COLUMN product_id DROP NOT NULL;
CREATE INDEX idx_order_customer_id ON "order"(customer_id);
CREATE INDEX idx_order_cart_id ON "order"(cart_id);

-- Expand status enum
ALTER TABLE "order" DROP CONSTRAINT "order_status_check";
ALTER TABLE "order" ADD CONSTRAINT "order_status_check"
  CHECK (
    status IN (
      'pending',
      'awaiting_payment',
      'paid',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    )
  );

-- Snapshot addresses at purchase time
CREATE TABLE order_address (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('shipping', 'billing')),
  full_name text NOT NULL,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'BR',
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, type)
);
CREATE INDEX idx_order_address_order_id ON order_address(order_id);

CREATE TABLE order_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
  product_variant_id uuid NOT NULL REFERENCES product_variant(id)
    ON DELETE RESTRICT,
  product_name text NOT NULL,
  variant_name text NOT NULL,
  sku text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_cents bigint NOT NULL CHECK (unit_price_cents >= 0),
  is_digital boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_item_order_id ON order_item(order_id);
CREATE INDEX idx_order_item_product_variant_id
  ON order_item(product_variant_id);
`;

const migration0006 = `
CREATE TABLE payment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES "order"(id) ON DELETE RESTRICT,
  provider text NOT NULL CHECK (provider IN ('stripe', 'woovi')),
  provider_id text,
  idempotency_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (
      status IN (
        'pending',
        'processing',
        'succeeded',
        'failed',
        'cancelled',
        'refunded'
      )
    ),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'BRL' CHECK (length(currency) = 3),
  provider_data jsonb NOT NULL DEFAULT '{}',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_payment_provider_provider_id
  ON payment(provider, provider_id) WHERE provider_id IS NOT NULL;
CREATE UNIQUE INDEX idx_payment_provider_idempotency_key
  ON payment(provider, idempotency_key);
CREATE INDEX idx_payment_order_id ON payment(order_id);
CREATE INDEX idx_payment_status ON payment(status);

CREATE TABLE webhook_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('stripe', 'woovi')),
  event_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  processing_status text NOT NULL DEFAULT 'pending'
    CHECK (
      processing_status IN (
        'pending',
        'processing',
        'completed',
        'failed'
      )
    ),
  error_message text,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE UNIQUE INDEX idx_webhook_event_provider_event_id
  ON webhook_event(provider, event_id);
CREATE INDEX idx_webhook_event_processing_status
  ON webhook_event(processing_status);
CREATE INDEX idx_webhook_event_provider ON webhook_event(provider);
`;

const migration0007 = `
-- Extend product_variant with stock and physical shipping attributes
ALTER TABLE product_variant
  ADD COLUMN stock integer,
  ADD COLUMN weight_grams integer
    CHECK (weight_grams IS NULL OR weight_grams > 0),
  ADD COLUMN length_cm numeric(8,2)
    CHECK (length_cm IS NULL OR length_cm > 0),
  ADD COLUMN width_cm numeric(8,2)
    CHECK (width_cm IS NULL OR width_cm > 0),
  ADD COLUMN height_cm numeric(8,2)
    CHECK (height_cm IS NULL OR height_cm > 0);

-- Fulfillment tracks shipment or digital delivery per order
CREATE TABLE fulfillment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES "order"(id) ON DELETE RESTRICT,
  type text NOT NULL CHECK (type IN ('physical', 'digital')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (
      status IN (
        'pending',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'failed'
      )
    ),
  provider text,
  tracking_code text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'
    CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fulfillment_order_id ON fulfillment(order_id);
CREATE INDEX idx_fulfillment_status ON fulfillment(status);
CREATE INDEX idx_fulfillment_type ON fulfillment(type);

-- Shipping quotes for physical order items
CREATE TABLE shipping_quote (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
  carrier text NOT NULL,
  service text NOT NULL,
  price_cents bigint NOT NULL CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'BRL'
    CHECK (length(currency) = 3),
  estimated_days integer CHECK (estimated_days IS NULL OR estimated_days > 0),
  status text NOT NULL DEFAULT 'quoted'
    CHECK (status IN ('quoted', 'selected', 'expired')),
  expires_at timestamptz,
  selected_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'
    CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_shipping_quote_order_id ON shipping_quote(order_id);
CREATE INDEX idx_shipping_quote_status ON shipping_quote(status);
CREATE INDEX idx_shipping_quote_expires_at
  ON shipping_quote(expires_at)
  WHERE status = 'quoted';
`;

export const migrations: ReadonlyArray<{
  readonly id: number;
  readonly name: string;
  readonly sql: string;
}> = [
  {
    id: 1,
    name: "0001_init",
    sql: migration0001,
  },
  {
    id: 2,
    name: "0002_create_order",
    sql: migration0002,
  },
  {
    id: 3,
    name: "0003_add_product_price_cents",
    sql: migration0003,
  },
  {
    id: 4,
    name: "0004_add_digital_and_logging",
    sql: migration0004,
  },
  {
    id: 5,
    name: "0005_cart_order_address",
    sql: migration0005,
  },
  {
    id: 6,
    name: "0006_payments_webhooks",
    sql: migration0006,
  },
  {
    id: 7,
    name: "0007_stock_fulfillment_shipping",
    sql: migration0007,
  },
];
