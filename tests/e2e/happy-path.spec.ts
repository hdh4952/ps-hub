import { test, expect } from "@playwright/test";
import { seedE2EUser } from "./_seed";

test.beforeAll(async () => {
  await seedE2EUser();
});

test("add handle, create group, assign, land on dashboard", async ({ page }) => {
  // Codeforces upstream is mocked at the cached_profiles row level (see tests/e2e/_seed.ts).
  // Plan-verbatim context.route() interception was removed: ps-hub's adapter runs server-side
  // (Node fetch from /api/favorites), so browser-context interception would not fire.

  // 1) Create a group named "legends"
  await page.goto("/groups");
  await page.getByPlaceholder("Group name").fill("legends");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("legends")).toBeVisible();

  // 2) Add a favorite (codeforces / tourist) and assign it to "legends"
  await page.goto("/add");
  await page.locator("select").selectOption("codeforces");
  // Use role-based selector: plan's `input.first()` resolves to a hidden Next.js
  // server-action ID input on this page, not the Handle textbox.
  await page.getByRole("textbox").first().fill("tourist");
  await page.getByLabel("legends").check();
  await page.getByRole("button", { name: "Add favorite" }).click();

  // 3) Lands on dashboard with the new handle visible
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText("tourist")).toBeVisible();
});
