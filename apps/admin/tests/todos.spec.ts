import { expect, test } from "@playwright/test";

test.describe("admin todos", () => {
  test("renders dashboard route", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Admin Dashboard" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Todos" })).toBeVisible();
  });

  test("renders todos table shell", async ({ page }) => {
    await page.goto("/todos");

    await expect(page.getByRole("heading", { name: "Todos" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Title" })).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Status" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Created" })
    ).toBeVisible();
  });
});
