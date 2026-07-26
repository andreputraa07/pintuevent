export function validateTicketQuantity({ quantity, minimum = 1, maximum = 5, remaining, salesStart, salesEnd, now = new Date() }) {
  if (!Number.isInteger(quantity)) return "Jumlah tiket harus berupa bilangan bulat.";
  if (quantity < minimum) return `Minimum pembelian ${minimum} tiket.`;
  if (quantity > maximum) return `Maksimum pembelian ${maximum} tiket.`;
  if (quantity > remaining) return "Jumlah tiket melebihi stok tersedia.";
  if (salesStart && now < new Date(salesStart)) return "Penjualan tiket belum dimulai.";
  if (salesEnd && now > new Date(salesEnd)) return "Penjualan tiket sudah berakhir.";
  return null;
}

export function canPurchaseEvent(event, now = new Date()) {
  if (["cancelled", "completed"].includes(event.status)) return false;
  if (event.sales_start && now < new Date(event.sales_start)) return false;
  if (event.sales_end && now > new Date(event.sales_end)) return false;
  return event.remaining > 0;
}

