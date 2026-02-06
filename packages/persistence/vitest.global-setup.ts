import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { GlobalSetupContext } from "vitest/node";

let container: Awaited<
  ReturnType<PostgreSqlContainer["start"]>
> | undefined;

export async function setup({ provide }: GlobalSetupContext) {
  container = await new PostgreSqlContainer(
    "postgres:alpine",
  ).start();
  provide("dbUrl", container.getConnectionUri());
}

export async function teardown() {
  await container?.stop();
}
