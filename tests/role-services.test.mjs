import test from "node:test";
import assert from "node:assert/strict";
import { validateVoucher } from "../src/services/voucherService.js";
import { validateWithdrawal } from "../src/services/withdrawalService.js";
import { sanitizeCsvCell } from "../src/services/attendeeService.js";

test("voucher tidak valid dan kedaluwarsa ditolak", () => {
  assert.equal(validateVoucher(null, 100000).valid, false);
  assert.equal(validateVoucher({ status: "active", expiresAt: "2020-01-01" }, 100000, new Date("2026-01-01")).valid, false);
});
test("withdrawal melebihi saldo ditolak", () => assert.match(validateWithdrawal(200, 100), /melebihi/));
test("export CSV mencegah formula injection", () => assert.equal(sanitizeCsvCell("=SUM(A1)"), "\"'=SUM(A1)\""));
