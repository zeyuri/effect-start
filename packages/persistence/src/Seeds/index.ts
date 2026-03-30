// SQL content is embedded directly to avoid node:fs dependency.

const seed0001 = `
INSERT INTO product (id, name, description, image_url)
VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Wireless Headphones', 'Premium noise-cancelling wireless headphones with 30h battery life', 'https://images.example.com/headphones.jpg'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Mechanical Keyboard', 'Compact 75% mechanical keyboard with hot-swappable switches', 'https://images.example.com/keyboard.jpg'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'USB-C Hub', '7-in-1 USB-C hub with HDMI, USB-A, and SD card reader', 'https://images.example.com/usb-hub.jpg')
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_variant (id, product_id, name, sku, price_cents, currency)
VALUES
  ('b1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'Black', 'WH-BLK-001', 29990, 'BRL'),
  ('b1b2c3d4-0002-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'White', 'WH-WHT-001', 29990, 'BRL'),
  ('b1b2c3d4-0001-4000-8000-000000000002', 'a1b2c3d4-0002-4000-8000-000000000002', 'Red Switches', 'KB-RED-001', 44990, 'BRL'),
  ('b1b2c3d4-0002-4000-8000-000000000002', 'a1b2c3d4-0002-4000-8000-000000000002', 'Blue Switches', 'KB-BLU-001', 44990, 'BRL'),
  ('b1b2c3d4-0003-4000-8000-000000000002', 'a1b2c3d4-0002-4000-8000-000000000002', 'Brown Switches', 'KB-BRN-001', 47990, 'BRL'),
  ('b1b2c3d4-0001-4000-8000-000000000003', 'a1b2c3d4-0003-4000-8000-000000000003', 'Space Gray', 'HUB-GRY-001', 19990, 'BRL')
ON CONFLICT (id) DO NOTHING;
`;

export const seeds: ReadonlyArray<{
  readonly id: number;
  readonly name: string;
  readonly sql: string;
}> = [
  {
    id: 1,
    name: "0001_products",
    sql: seed0001,
  },
];
