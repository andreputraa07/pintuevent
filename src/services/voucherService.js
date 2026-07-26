export function validateVoucher(voucher, subtotal, now = new Date()) {
  if (!voucher || voucher.status !== "active") {
    return { valid: false, message: "Voucher tidak valid." };
  }
  if (voucher.expiresAt && new Date(voucher.expiresAt) < now) {
    return { valid: false, message: "Voucher sudah kedaluwarsa." };
  }
  if (subtotal < (voucher.minimum || 0)) {
    return { valid: false, message: "Minimum transaksi belum terpenuhi." };
  }
  return { valid: true, message: "Voucher diterapkan." };
}
