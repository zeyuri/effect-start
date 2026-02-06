// SQL content is embedded directly to avoid node:fs dependency.

const migration0001 = `
CREATE TABLE todo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
`;

export const migrations: ReadonlyArray<{
  readonly id: number;
  readonly name: string;
  readonly sql: string;
}> = [
  {
    id: 1,
    name: "0001_create_todos",
    sql: migration0001,
  },
];
