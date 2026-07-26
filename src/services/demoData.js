/** @type {import("../types/customer").CustomerEvent[]} */
export const demoEvents = [
  {
    id: "evt-1",
    slug: "jakarta-music-festival-2026",
    title: "Jakarta Music Festival 2026",
    category: "Musik",
    city: "Jakarta",
    date: "22 Agustus 2026 · 19.00",
    location: "Istora Senayan",
    price: 250000,
    quota: 1200,
    sold: 834,
    image: "/assets/hero-concert.webp",
    status: "published",
  },
  {
    id: "evt-2",
    slug: "festival-kreatif-nusantara",
    title: "Festival Kreatif Nusantara",
    category: "Seni & Budaya",
    city: "Jakarta",
    date: "28 Agustus 2026 · 10.00",
    location: "GBK City Park",
    price: 125000,
    quota: 800,
    sold: 490,
    image: "/assets/festival.webp",
    status: "published",
  },
  {
    id: "evt-3",
    slug: "workshop-melukis-kanvas",
    title: "Workshop Melukis di Atas Kanvas",
    category: "Workshop",
    city: "Jakarta",
    date: "6 September 2026 · 10.00",
    location: "Art Space Kemang",
    price: 350000,
    quota: 40,
    sold: 28,
    image: "/assets/workshop.webp",
    status: "published",
  },
];

/** @type {import("../types/customer").CustomerOrder[]} */
export const demoOrders = [
  {
    id: "ord-1",
    number: "PE-2026-00041",
    event: demoEvents[0],
    quantity: 2,
    total: 500000,
    status: "paid",
    payment: "Virtual Account",
    createdAt: "20 Juli 2026",
  },
  {
    id: "ord-2",
    number: "PE-2026-00058",
    event: demoEvents[1],
    quantity: 1,
    total: 125000,
    status: "pending",
    payment: "QRIS",
    createdAt: "25 Juli 2026",
    expiresAt: "26 Juli 2026 · 13.00",
  },
];

/** @type {import("../types/customer").CustomerTicket[]} */
export const demoTickets = [
  {
    id: "tkt-1",
    code: "PINTU-A7K9-21QX",
    event: demoEvents[0],
    type: "Regular",
    attendee: "André Putra",
    status: "active",
    checkedIn: false,
    qrValue: "pintuevent:tkt-1:A7K921QX",
  },
  {
    id: "tkt-2",
    code: "PINTU-M4P2-88DL",
    event: demoEvents[0],
    type: "Regular",
    attendee: "Tamu André",
    status: "active",
    checkedIn: false,
    qrValue: "pintuevent:tkt-2:M4P288DL",
  },
];

/** @type {import("../types/customer").CustomerVoucher[]} */
export const demoVouchers = [
  {
    id: "v-1",
    code: "PINTUMOMEN",
    type: "percentage",
    value: 20,
    minimum: 100000,
    maxDiscount: 50000,
    status: "active",
    validUntil: "31 Agustus 2026",
  },
];

/** @type {import("../types/customer").CustomerNotification[]} */
export const demoNotifications = [
  {
    id: "n-1",
    title: "Tiket berhasil diterbitkan",
    body: "Dua tiket Jakarta Music Festival sudah tersedia.",
    read: false,
    createdAt: "20 Juli 2026",
  },
  {
    id: "n-2",
    title: "Pesanan menunggu pembayaran",
    body: "Selesaikan pesanan PE-2026-00058 sebelum kedaluwarsa.",
    read: false,
    createdAt: "25 Juli 2026",
  },
];
