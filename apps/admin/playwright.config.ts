import { defineConfig, devices } from "@playwright/test";

const port = 3334;
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://starter:starter@localhost:5432/starter";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "bun --watch src/main.ts",
      url: "http://localhost:3000/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      cwd: "../api",
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
    },
    {
      command: `bun run dev -- --port ${port}`,
      url: `http://localhost:${port}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
