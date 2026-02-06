// SQL content is embedded directly to avoid node:fs dependency.

const seed0001 = `
INSERT INTO todo (id, title, completed)
VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Learn Effect', false),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Build a Todo App', false),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Deploy to production', false)
ON CONFLICT (id) DO NOTHING;
`;

export const seeds: ReadonlyArray<{
  readonly id: number;
  readonly name: string;
  readonly sql: string;
}> = [
  {
    id: 1,
    name: "0001_todos",
    sql: seed0001,
  },
];
