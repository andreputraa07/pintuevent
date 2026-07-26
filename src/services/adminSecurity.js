export function maskBankAccount(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length <= 4
    ? "••••"
    : `${"•".repeat(Math.min(8, digits.length - 4))}${digits.slice(-4)}`;
}

export function validateRefund(amount, paidAmount, alreadyRefunded = 0) {
  if (amount <= 0) return "Nominal refund harus lebih dari nol.";
  if (amount + alreadyRefunded > paidAmount) {
    return "Refund melebihi jumlah pembayaran.";
  }
  return null;
}

export function requireReason(reason) {
  return reason?.trim().length >= 5 ? null : "Alasan minimal 5 karakter.";
}
