import { expect, test, type Page } from "@playwright/test";

async function openAsCustomer(page: Page, path: string) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "pintuevent_session",
      JSON.stringify({
        id: "demo-customer",
        email: "customer@pintuevent.my.id",
        role: "customer",
        status: "active",
      }),
    );
  });
  await page.goto(path);
  await expect(page.locator(".portal-content")).toBeVisible({
    timeout: 15_000,
  });
}

async function setRoleSession(page: Page, role: "organizer" | "admin") {
  await page.goto("/");
  await page.evaluate((value) => {
    window.localStorage.setItem(
      "pintuevent_session",
      JSON.stringify({
        id: `demo-${value}`,
        email: `${value}@pintuevent.my.id`,
        role: value,
        status: "active",
      }),
    );
  }, role);
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function expectNoMojibake(page: Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/[\u00c2\u00c3\ufffd]|â(?:€|ˆ|€™|œ|“|”)/u);
}

async function expectImagesLoaded(page: Page, selector: string) {
  const images = page.locator(selector);
  const count = await images.count();
  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    const image = images.nth(index);
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate(
          (element) =>
            (element as HTMLImageElement).complete &&
            (element as HTMLImageElement).naturalWidth > 0,
        ),
      )
      .toBe(true);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
}

test("visual beranda desktop dan mobile lengkap tanpa overflow", async ({
  page,
}) => {
  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator("main")).toHaveAttribute("data-hydrated", "true");
    await expectImagesLoaded(page, ".hero img, .event-card img");
    await expectNoHorizontalOverflow(page);
    await expectNoMojibake(page);
    await page.screenshot({
      path: `test-results/home-${viewport.name}.png`,
      fullPage: true,
    });
  }
});

test("visual customer desktop presisi tanpa overflow", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openAsCustomer(page, "/dashboard");
  await expectNoHorizontalOverflow(page);
  await expectImagesLoaded(
    page,
    ".next-event-media img, .event-portal-card img",
  );
  await page.screenshot({
    path: "test-results/customer-dashboard-desktop.png",
    fullPage: true,
  });

  await page.goto("/checkout/jakarta-music-festival-2026");
  await expect(
    page.getByRole("heading", { name: "Jakarta Music Festival 2026" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectImagesLoaded(page, ".payment-summary-event img");
  await page.screenshot({
    path: "test-results/customer-checkout-desktop.png",
    fullPage: true,
  });
});

test("visual customer mobile presisi tanpa overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openAsCustomer(page, "/dashboard");
  await expectNoHorizontalOverflow(page);
  await expectImagesLoaded(
    page,
    ".next-event-media img, .event-portal-card img",
  );
  await page.screenshot({
    path: "test-results/customer-dashboard-mobile.png",
    fullPage: true,
  });

  await page.goto("/dashboard/tickets");
  await expect(
    page.getByRole("heading", { name: "Tiket digital" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: "test-results/customer-tickets-mobile.png",
    fullPage: true,
  });
});

test("seluruh route customer mobile bebas overflow dan runtime error", async ({
  page,
}) => {
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
    if (page.url() !== new URL(route, "http://127.0.0.1:4173").href)
      await page.goto(route);
    await expect(page.locator(".portal-content")).toBeVisible({
      timeout: 15_000,
    });
    await expectNoHorizontalOverflow(page);
    await expectNoMojibake(page);
    await expect(page.locator("vite-error-overlay")).toHaveCount(0);
  }
});

test("seluruh route organizer dan admin mobile bebas error visual", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 390, height: 844 });

  const routeGroups = {
    organizer: [
      "",
      "events",
      "sales",
      "attendees",
      "check-in",
      "finance",
      "promotions",
      "team",
      "profile",
    ],
    admin: [
      "",
      "users",
      "organizers",
      "event-verifications",
      "orders",
      "payments",
      "refunds",
      "withdrawals",
      "categories",
      "audit-logs",
      "settings",
    ],
  } as const;

  for (const role of ["organizer", "admin"] as const) {
    await setRoleSession(page, role);
    for (const section of routeGroups[role]) {
      await page.goto(section ? `/${role}/${section}` : `/${role}`);
      await expect(page.locator(".portal-content")).toBeVisible({
        timeout: 15_000,
      });
      await expectNoHorizontalOverflow(page);
      await expectNoMojibake(page);
      await expect(page.locator("vite-error-overlay")).toHaveCount(0);
    }
    await page.screenshot({
      path: `test-results/${role}-mobile.png`,
      fullPage: true,
    });
  }
});
