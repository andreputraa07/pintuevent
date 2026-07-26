import test from "node:test";
import assert from "node:assert/strict";
import { validateVoucher } from "../src/services/voucherService.js";
import { validateWithdrawal } from "../src/services/withdrawalService.js";
import { sanitizeCsvCell } from "../src/services/attendeeService.js";
import { canPurchaseEvent, validateTicketQuantity } from "../src/services/checkoutValidation.js";

test("voucher tidak valid dan kedaluwarsa ditolak", () => {
  assert.equal(validateVoucher(null, 100000).valid, false);
  assert.equal(validateVoucher({ status: "active", expiresAt: "2020-01-01" }, 100000, new Date("2026-01-01")).valid, false);
});
test("withdrawal melebihi saldo ditolak", () => assert.match(validateWithdrawal(200, 100), /melebihi/));
test("export CSV mencegah formula injection", () => assert.equal(sanitizeCsvCell("=SUM(A1)"), "\"'=SUM(A1)\""));
test("jumlah tiket mematuhi minimum, maksimum, dan stok", () => {
  assert.match(validateTicketQuantity({ quantity: 0, minimum: 1, maximum: 5, remaining: 10 }), /Minimum/);
  assert.match(validateTicketQuantity({ quantity: 6, minimum: 1, maximum: 5, remaining: 10 }), /Maksimum/);
  assert.match(validateTicketQuantity({ quantity: 3, minimum: 1, maximum: 5, remaining: 2 }), /stok/);
  assert.equal(validateTicketQuantity({ quantity: 2, minimum: 1, maximum: 5, remaining: 2 }), null);
});
test("event batal, selesai, atau habis tidak dapat dibeli", () => {
  assert.equal(canPurchaseEvent({ status: "cancelled", remaining: 10 }), false);
  assert.equal(canPurchaseEvent({ status: "published", remaining: 0 }), false);
  assert.equal(canPurchaseEvent({ status: "published", remaining: 2 }), true);
});
