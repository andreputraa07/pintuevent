import test from "node:test";
import assert from "node:assert/strict";
import { validateVoucher } from "../src/services/voucherService.js";
import { validateWithdrawal } from "../src/services/withdrawalService.js";
import { sanitizeCsvCell } from "../src/services/attendeeService.js";
import {
  canPurchaseEvent,
  validateTicketQuantity,
} from "../src/services/checkoutValidation.js";
import {
  canDeleteTicketType,
  toEventSlug,
  validateTicketType,
} from "../src/services/organizerValidation.js";
import {
  maskBankAccount,
  requireReason,
  validateRefund,
} from "../src/services/adminSecurity.js";
import {
  authorizeSession,
  normalizeRole,
} from "../src/services/authorization.js";
import { safeReturnTo } from "../src/services/navigation.js";
import { getCustomerSnapshot } from "../src/services/customerService.js";
import { listPublishedEvents } from "../src/services/eventService.js";
import { readFile } from "node:fs/promises";

test("voucher tidak valid dan kedaluwarsa ditolak", () => {
  assert.equal(validateVoucher(null, 100000).valid, false);
  assert.equal(
    validateVoucher(
      { status: "active", expiresAt: "2020-01-01" },
      100000,
      new Date("2026-01-01"),
    ).valid,
    false,
  );
});
test("withdrawal melebihi saldo ditolak", () =>
  assert.match(validateWithdrawal(200, 100), /melebihi/));
test("export CSV mencegah formula injection", () =>
  assert.equal(sanitizeCsvCell("=SUM(A1)"), '"\'=SUM(A1)"'));
test("jumlah tiket mematuhi minimum, maksimum, dan stok", () => {
  assert.match(
    validateTicketQuantity({
      quantity: 0,
      minimum: 1,
      maximum: 5,
      remaining: 10,
    }),
    /Minimum/,
  );
  assert.match(
    validateTicketQuantity({
      quantity: 6,
      minimum: 1,
      maximum: 5,
      remaining: 10,
    }),
    /Maksimum/,
  );
  assert.match(
    validateTicketQuantity({
      quantity: 3,
      minimum: 1,
      maximum: 5,
      remaining: 2,
    }),
    /stok/,
  );
  assert.equal(
    validateTicketQuantity({
      quantity: 2,
      minimum: 1,
      maximum: 5,
      remaining: 2,
    }),
    null,
  );
});
test("event batal, selesai, atau habis tidak dapat dibeli", () => {
  assert.equal(canPurchaseEvent({ status: "cancelled", remaining: 10 }), false);
  assert.equal(canPurchaseEvent({ status: "published", remaining: 0 }), false);
  assert.equal(canPurchaseEvent({ status: "published", remaining: 2 }), true);
});
test("slug event aman dan ticket type tervalidasi", () => {
  assert.equal(
    toEventSlug("Festival Kreatif Nusantara!"),
    "festival-kreatif-nusantara",
  );
  assert.match(
    validateTicketType({
      name: "VIP",
      price: 10,
      quota: 10,
      minimum: 2,
      maximum: 1,
      salesStart: new Date("2026-01-01"),
      salesEnd: new Date("2026-02-01"),
    }),
    /Batas/,
  );
  assert.equal(canDeleteTicketType(1), false);
});
test("admin memask rekening dan menolak refund berlebih", () => {
  assert.equal(maskBankAccount("1234567890"), "••••••7890");
  assert.match(validateRefund(800, 1000, 300), /melebihi/);
  assert.match(requireReason("no"), /minimal/);
});
test("protected dan role-based route menolak sesi tidak sesuai", () => {
  assert.equal(authorizeSession(null, "admin").redirect, "/login");
  assert.equal(
    authorizeSession({ role: "customer", status: "active" }, "admin").redirect,
    "/unauthorized",
  );
  assert.equal(
    authorizeSession({ role: "admin", status: "suspended" }, "admin").redirect,
    "/account-suspended",
  );
  assert.equal(
    authorizeSession({ role: "admin", status: "active" }, "admin").allowed,
    true,
  );
});

test("role dan return URL dinormalisasi sebelum navigasi", () => {
  assert.equal(normalizeRole("admin"), "admin");
  assert.equal(normalizeRole("owner"), "customer");
  assert.equal(
    safeReturnTo("/dashboard/orders?status=paid"),
    "/dashboard/orders?status=paid",
  );
  assert.equal(
    safeReturnTo("https://example.com/phishing", "/dashboard"),
    "/dashboard",
  );
  assert.equal(
    safeReturnTo("//example.com/phishing", "/dashboard"),
    "/dashboard",
  );
  assert.equal(safeReturnTo("/\\example.com", "/dashboard"), "/dashboard");
});

test("snapshot dan katalog demo memiliki bentuk data yang konsisten", async () => {
  const snapshot = await getCustomerSnapshot("demo-customer");
  assert.equal(snapshot.mode, "demo");
  assert.equal(snapshot.profile.id, "demo-customer");
  assert.ok(snapshot.events.every((event) => event.slug && event.price >= 0));
  assert.ok(snapshot.orders.every((order) => order.event?.id));
  assert.ok(snapshot.tickets.every((ticket) => ticket.qrValue));

  const workshops = await listPublishedEvents({ category: "Workshop" });
  assert.equal(workshops.length, 1);
  assert.equal(workshops[0].slug, "workshop-melukis-kanvas");
});
test("service role key tidak disimpan pada bundle frontend", async () => {
  const files = [
    "../src/services/supabaseClient.js",
    "../src/services/adminService.js",
  ];
  const source = (
    await Promise.all(
      files.map((path) => readFile(new URL(path, import.meta.url), "utf8")),
    )
  ).join("\n");
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY/);
});
