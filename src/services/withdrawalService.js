export function validateWithdrawal(amount, balance) {
  if (amount <= 0) return "Jumlah harus lebih dari nol.";
  if (amount > balance) return "Jumlah melebihi saldo tersedia.";
  return null;
}
