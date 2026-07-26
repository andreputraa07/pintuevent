import { expect, test, type Page } from "@playwright/test";

async function openAsCustomer(page: Page, path: string) {
  await page.addInitScript(() => {
    window.localStorage.setItem("pintuevent_session", JSON.stringify({
      id: "demo-customer",
      email: "customer@pintuevent.my.id",
      role: "customer",
      status: "active",
    }));
  });
  await page.goto(path);
  await expect(page.locator(".portal-content")).toBeVisible({ timeout: 15_000 });
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test("visual customer desktop presisi tanpa overflow", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openAsCustomer(page, "/dashboard");
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/customer-dashboard-desktop.png", fullPage: true });

  await page.goto("/checkout/jakarta-music-festival-2026");
  await expect(page.getByRole("heading", { name: "Jakarta Music Festival 2026" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/customer-checkout-desktop.png", fullPage: true });
});

test("visual customer mobile presisi tanpa overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openAsCustomer(page, "/dashboard");
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/customer-dashboard-mobile.png", fullPage: true });

  await page.goto("/dashboard/tickets");
  await expect(page.getByRole("heading", { name: "Tiket digital" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/customer-tickets-mobile.png", fullPage: true });
});

test("seluruh route customer mobile bebas overflow dan runtime error", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const routes = [
    "/dashboard",
    "/dashboard/tickets",
    "/dashboard/tickets/tkt-1",
    "/dashboard/orders",
    "/dashboard/orders/ord-2",
    "/dashboard/favorites",
    "/dashboard/vouchers",
    "/dashboard/notifications",
    "/dashboard/profile",
    "/dashboard/settings",
    "/checkout/jakarta-music-festival-2026",
    "/payment/demo-order",
    "/payment-success/demo-order",
  ];

  await openAsCustomer(page, routes[0]);
  for (const route of routes) {
    if (page.url() !== new URL(route, "http://127.0.0.1:4173").href) await page.goto(route);
    await expect(page.locator(".portal-content")).toBeVisible({ timeout: 15_000 });
    await expectNoHorizontalOverflow(page);
    await expect(page.locator("vite-error-overlay")).toHaveCount(0);
  }
});
