import { expect, test, type Page } from "@playwright/test";

const customerSession = {
  id: "demo-customer",
  email: "customer@pintuevent.my.id",
  role: "customer",
  status: "active",
};

async function useSession(page: Page, session = customerSession) {
  await page.addInitScript((value) => {
    window.localStorage.setItem("pintuevent_session", JSON.stringify(value));
  }, session);
}

async function expectNoMojibake(page: Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/[\u00c2\u00c3\ufffd]|â(?:€|ˆ|€™|œ|“|”)/u);
}

test.describe("Beranda publik", () => {
  test("konten utama tidak memiliki karakter encoding rusak", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("PintuEvent");
    await expect(
      page.getByRole("heading", {
        name: /Temukan event yang bikin/,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Cara beli tiket di PintuEvent" }),
    ).toBeVisible();
    await expect(page.locator(".purchase-steps > li")).toHaveCount(5);
    await expect(
      page.getByRole("link", { name: "Masuk", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Buka menu akun" }),
    ).toHaveCount(0);
    await expectNoMojibake(page);
  });

  test("menu akun menggantikan tombol masuk setelah pengguna login", async ({
    page,
  }) => {
    await useSession(page);
    await page.goto("/");

    const accountButton = page.getByRole("button", {
      name: "Buka menu akun",
    });
    await expect(accountButton).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("link", { name: "Masuk", exact: true }),
    ).toHaveCount(0);

    await accountButton.click();
    const accountMenu = page.getByRole("menu");
    await expect(accountMenu).toBeVisible();
    await expect(
      accountMenu.getByRole("menuitem", { name: /Dasbor Saya/ }),
    ).toHaveAttribute("href", "/dashboard");
    await expect(
      accountMenu.getByRole("menuitem", { name: /Tiket Saya/ }),
    ).toHaveAttribute("href", "/dashboard/tickets");
    await expect(
      accountMenu.getByRole("menuitem", { name: /Pesanan Saya/ }),
    ).toHaveAttribute("href", "/dashboard/orders");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Buka menu" }).click();
    const mobileAccount = page.locator(".mobile-account-card");
    await expect(mobileAccount).toBeVisible();
    await expect(
      mobileAccount.getByRole("link", { name: /Dasbor Saya/ }),
    ).toHaveAttribute("href", "/dashboard");
    await expect(
      mobileAccount.getByRole("link", { name: /Tiket Saya/ }),
    ).toHaveAttribute("href", "/dashboard/tickets");

    await mobileAccount.getByRole("button", { name: /Keluar/ }).click();
    await page.getByRole("button", { name: "Buka menu" }).click();
    await expect(
      page.getByRole("link", { name: "Masuk", exact: true }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("pintuevent_session")),
      )
      .toBeNull();

    const organizerPage = await page.context().newPage();
    await organizerPage.addInitScript(() => {
      localStorage.setItem(
        "pintuevent_session",
        JSON.stringify({
          id: "demo-organizer",
          email: "organizer@pintuevent.my.id",
          role: "organizer",
          status: "active",
        }),
      );
    });
    await organizerPage.setViewportSize({ width: 1280, height: 800 });
    await organizerPage.goto("/");
    const organizerAccountButton = organizerPage.getByRole("button", {
      name: "Buka menu akun",
    });
    await expect(organizerAccountButton).toBeVisible({ timeout: 15_000 });
    await organizerAccountButton.click();
    await expect(
      organizerPage
        .getByRole("menu")
        .getByRole("menuitem", { name: /Dasbor Saya/ }),
    ).toHaveAttribute("href", "/organizer");
    await organizerPage.close();
  });

  test("kategori, pencarian, reset, favorit, dan promo berfungsi", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("main")).toHaveAttribute("data-hydrated", "true");
    const categories = page.locator(".category-card");
    await expect(categories).toHaveCount(5);

    const workshop = page
      .locator(".category-card")
      .filter({ hasText: "Workshop" });
    await workshop.click();
    await expect(workshop).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".event-card")).toHaveCount(2);

    await page.getByPlaceholder("Cari event atau artis").fill("Jakarta Music");
    await page.getByRole("button", { name: /Cari Event/ }).click();
    await expect(page.locator(".event-card")).toHaveCount(0);
    await page.getByRole("button", { name: "Reset pencarian" }).click();
    await expect(page.locator(".event-card")).toHaveCount(6);

    const favorite = page.getByRole("button", {
      name: /Simpan Jakarta Music Festival/,
    });
    await favorite.click();
    await expect(
      page.getByRole("button", { name: /Hapus Jakarta Music Festival/ }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Salin kode promo/ }).click();
    await expect(page.getByRole("status")).toContainText("PINTUMOMEN");

    const workshopCheckout = page.getByRole("link", {
      name: "Beli tiket Workshop Melukis di Atas Kanvas",
    });
    await expect(workshopCheckout).toHaveAttribute(
      "href",
      "/checkout/workshop-melukis-kanvas",
    );
  });

  test("navigasi mobile mengarah ke section yang benar", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const menuButton = page.getByRole("button", { name: "Buka menu" });
    await expect(menuButton).toBeEnabled();
    await menuButton.click();
    const mobileNav = page.getByRole("navigation", { name: "Navigasi mobile" });
    await expect(mobileNav).toBeVisible();
    await expect(
      mobileNav.getByRole("link", { name: /Cara Beli/ }),
    ).toHaveAttribute("href", "#cara-beli");
    await mobileNav.getByRole("link", { name: /Jelajahi Event/ }).click();
    await expect(page).toHaveURL(/#event-pilihan$/);
  });
});

test.describe("Autentikasi dan otorisasi", () => {
  test("halaman customer meminta login dan mempertahankan returnTo", async ({
    page,
  }) => {
    await page.goto("/dashboard/tickets");
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fdashboard%2Ftickets/, {
      timeout: 20_000,
    });
  });

  test("login demo customer masuk ke dashboard", async ({ page }) => {
    await page.goto("/login");
    const submit = page.getByRole("button", { name: "Masuk", exact: true });
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: /Selamat datang/ }),
    ).toBeVisible();
  });

  test("login menolak returnTo eksternal dan role tidak dikenal", async ({
    page,
  }) => {
    await page.goto(
      "/login?role=owner&returnTo=https%3A%2F%2Fexample.com%2Fphishing",
    );
    await expect(page.getByLabel("Role")).toHaveValue("customer");
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("role yang salah ditolak dan akun suspended dialihkan", async ({
    page,
  }) => {
    await useSession(page);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/unauthorized$/);

    const suspendedPage = await page.context().newPage();
    await suspendedPage.addInitScript(() => {
      window.localStorage.setItem(
        "pintuevent_session",
        JSON.stringify({
          id: "demo-customer",
          role: "customer",
          status: "suspended",
        }),
      );
    });
    await suspendedPage.goto("/dashboard");
    await expect(suspendedPage).toHaveURL(/\/account-suspended$/);
    await suspendedPage.close();
  });
});

test.describe("Alur customer", () => {
  test.beforeEach(async ({ page }) => useSession(page));

  test("dashboard, tiket QR, notifikasi, dan profil berfungsi", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Tiket aktif")).toBeVisible();
    await page.getByRole("link", { name: /Buka tiket/ }).click();
    await expect(page.locator(".qr-box svg")).toBeVisible();
    await expect(page.getByText("PINTU-A7K9-21QX")).toBeVisible();

    await page.goto("/dashboard/notifications");
    await expect(page.locator(".notification-item.unread")).toHaveCount(2);
    await page.getByRole("button", { name: "Tandai semua dibaca" }).click();
    await expect(page.locator(".notification-item.unread")).toHaveCount(0);

    await page.goto("/dashboard/profile");
    const name = page.getByLabel("Nama lengkap");
    await name.fill("A");
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(page.getByText("Nama minimal 3 karakter")).toBeVisible();
    await name.fill("Andre Putra");
    await page.getByLabel("Nomor telepon").fill("081234567890");
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(page.getByText("Profil berhasil diperbarui.")).toBeVisible();
  });

  test("checkout hingga pembayaran berhasil", async ({ page }) => {
    await page.goto("/checkout/jakarta-music-festival-2026");
    await expect(
      page.getByRole("heading", { name: "Jakarta Music Festival 2026" }),
    ).toBeVisible();
    await page
      .locator(".quantity")
      .getByRole("button", { name: "Tambah tiket" })
      .click();
    await expect(page.locator(".quantity strong")).toHaveText("2");
    await expect(page.locator(".payment-summary .total")).toContainText(
      /Rp\s*525\.000/,
    );

    for (let step = 1; step <= 4; step += 1) {
      await page.getByRole("button", { name: "Lanjut" }).click();
    }
    await expect(page.getByText("Simulasi pembayaran aktif")).toBeVisible();
    await page.getByRole("link", { name: "Buat pesanan" }).click();
    await expect(page).toHaveURL(/\/payment\/demo-order$/);
    await page
      .getByRole("link", { name: "Simulasikan pembayaran berhasil" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Pembayaran berhasil" }),
    ).toBeVisible();
  });

  test("simulasi pembayaran gagal dan kedaluwarsa memberikan hasil", async ({
    page,
  }) => {
    await page.goto("/payment/demo-order");
    await page
      .getByRole("button", { name: "Simulasikan pembayaran gagal" })
      .click();
    await expect(page.getByRole("status")).toContainText("gagal");
    await page
      .getByRole("button", { name: "Simulasikan pembayaran kedaluwarsa" })
      .click();
    await expect(page.getByRole("status")).toContainText("kedaluwarsa");
  });

  test("resource customer yang tidak ada tidak memakai data fallback", async ({
    page,
  }) => {
    await page.goto("/dashboard/tickets/tidak-ada");
    await expect(page.getByText("Tiket tidak ditemukan")).toBeVisible();

    await page.goto("/dashboard/orders/tidak-ada");
    await expect(page.getByText("Pesanan tidak ditemukan")).toBeVisible();

    await page.goto("/checkout/event-tidak-ada");
    await expect(page.getByText("Event tidak ditemukan")).toBeVisible();
  });
});

test.describe("Dashboard organizer dan admin", () => {
  for (const role of ["organizer", "admin"] as const) {
    test(`${role} dapat login, membuka dashboard, dan memakai drawer mobile`, async ({
      page,
    }) => {
      await page.goto(`/login?role=${role}`);
      const submit = page.getByRole("button", { name: "Masuk", exact: true });
      await expect(submit).toBeEnabled();
      await submit.click();
      await expect(page).toHaveURL(new RegExp(`/${role}$`));
      await expect(
        page.getByRole("heading", {
          name: role === "admin" ? "Dashboard Admin" : "Dashboard Organizer",
        }),
      ).toBeVisible();
      await expectNoMojibake(page);

      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole("button", { name: "Buka navigasi" }).click();
      await expect(page.locator(".portal-sidebar.open")).toBeVisible();
      await page.locator(".portal-sidebar nav a").nth(1).click();
      await expect(page.locator(".portal-sidebar.open")).toHaveCount(0);
    });
  }
});
