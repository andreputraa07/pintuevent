export function toEventSlug(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
export function validateTicketType(ticket) {
  if (!ticket.name?.trim()) return "Nama tiket wajib diisi.";
  if (ticket.price < 0) return "Harga tidak boleh negatif.";
  if (ticket.quota <= 0) return "Kuota harus lebih dari nol.";
  if (ticket.minimum < 1 || ticket.maximum < ticket.minimum) {
    return "Batas pembelian tidak valid.";
  }
  if (ticket.salesEnd <= ticket.salesStart) {
    return "Akhir penjualan harus setelah mulai penjualan.";
  }
  if (ticket.eventEnd && ticket.salesEnd > ticket.eventEnd) {
    return "Penjualan tidak boleh melewati waktu event.";
  }
  return null;
}

export function canDeleteTicketType(sold) {
  return sold === 0;
}
