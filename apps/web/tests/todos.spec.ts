import { expect, test } from "@playwright/test";

test.describe("web todos", () => {
  test("navigates from home to todos", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Effect Start" })).toBeVisible();

    await page.getByRole("link", { name: "View Todos" }).click();

    await expect(page).toHaveURL(/\/todos\/?$/);
    await expect(page.getByRole("heading", { name: "Todos" })).toBeVisible();
  });

  test("renders todo form controls", async ({ page }) => {
    await page.goto("/todos");

    await expect(page.getByPlaceholder("What needs to be done?")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to Home" })).toBeVisible();
  });
});
