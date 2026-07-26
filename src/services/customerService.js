import { isSupabaseConfigured, supabase } from "./supabaseClient.js";
import {
  demoEvents,
  demoNotifications,
  demoOrders,
  demoTickets,
  demoVouchers,
} from "./demoData.js";

/** @type {import("../types/customer").CustomerProfile} */
const demoProfile = {
  id: "demo-customer",
  full_name: "André Putra",
  email: "customer@pintuevent.my.id",
  phone: "0812-0000-2026",
  role: "customer",
  status: "active",
  avatar_url: null,
};

const fallbackImages = {
  Musik: "/assets/hero-concert.webp",
  Workshop: "/assets/workshop.webp",
  default: "/assets/festival.webp",
};

function formatDate(value) {
  if (!value) return "Jadwal akan diumumkan";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function imageForCategory(category) {
  return fallbackImages[category] ?? fallbackImages.default;
}

function normalizeEvent(row) {
  const ticketType = Array.isArray(row.ticket_types)
    ? row.ticket_types[0]
    : row.ticket_types;

  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    category: row.category || "Lainnya",
    city: row.city || "Online",
    date: formatDate(row.starts_at),
    location: row.location || "Online",
    price: Number(ticketType?.price ?? 0),
    quota: Number(ticketType?.quota ?? 0),
    sold: Number(ticketType?.sold ?? 0),
    image: row.image_url || imageForCategory(row.category),
    status: row.status,
  };
}

function normalizeOrder(row) {
  const items = row.order_items || [];
  const ticketType = items[0]?.ticket_types;
  const event = normalizeEvent({
    ...(ticketType?.events || {}),
    ticket_types: ticketType,
  });

  return {
    id: String(row.id),
    number: row.order_number,
    event,
    quantity: items.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0,
    ),
    total: Number(row.total),
    status: row.status,
    payment: row.payment_method || "Belum dipilih",
    createdAt: formatDate(row.created_at),
    expiresAt: row.expires_at ? formatDate(row.expires_at) : undefined,
  };
}

function normalizeTicket(row, profile) {
  return {
    id: String(row.id),
    code: row.code,
    event: normalizeEvent({
      ...(row.events || {}),
      ticket_types: row.ticket_types,
    }),
    type: row.ticket_types?.name || "Regular",
    attendee: row.attendees?.full_name || profile.full_name,
    status: row.status,
    checkedIn: Boolean(row.checked_in_at),
    qrValue: row.qr_value,
  };
}

function normalizeVoucher(row) {
  const voucher = row.vouchers || {};
  return {
    id: String(voucher.id || row.id),
    code: voucher.code || "-",
    type: voucher.discount_type || "fixed",
    value: Number(voucher.discount_value || 0),
    minimum: Number(voucher.minimum || 0),
    maxDiscount: voucher.max_discount
      ? Number(voucher.max_discount)
      : undefined,
    status: voucher.is_active ? "active" : "inactive",
    validUntil: voucher.ends_at ? formatDate(voucher.ends_at) : "Tanpa batas",
  };
}

function normalizeNotification(row) {
  return {
    id: String(row.id),
    title: row.title,
    body: row.body,
    read: Boolean(row.read_at),
    createdAt: formatDate(row.created_at),
  };
}

/** @returns {Promise<import("../types/customer").CustomerSnapshot>} */
export async function getCustomerSnapshot(userId) {
  if (!isSupabaseConfigured) {
    return {
      mode: "demo",
      profile: demoProfile,
      events: demoEvents,
      orders: demoOrders,
      tickets: demoTickets,
      vouchers: demoVouchers,
      notifications: demoNotifications,
    };
  }

  const [profile, events, orders, tickets, vouchers, notifications] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase
        .from("events")
        .select("*, ticket_types(*)")
        .eq("status", "published")
        .order("starts_at")
        .limit(20),
      supabase
        .from("orders")
        .select("*, order_items(*, ticket_types(*, events(*)))")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("tickets")
        .select("*, events(*), ticket_types(*), attendees(*)")
        .eq("user_id", userId),
      supabase
        .from("voucher_usages")
        .select("*, vouchers(*)")
        .eq("user_id", userId),
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

  const results = [profile, events, orders, tickets, vouchers, notifications];
  const error = results.find((item) => item.error)?.error;
  if (error) throw error;

  const normalizedProfile = {
    ...profile.data,
    email: profile.data.email || "",
    phone: profile.data.phone || "",
  };

  return {
    mode: "supabase",
    profile: normalizedProfile,
    events: (events.data || []).map(normalizeEvent),
    orders: (orders.data || []).map(normalizeOrder),
    tickets: (tickets.data || []).map((ticket) =>
      normalizeTicket(ticket, normalizedProfile),
    ),
    vouchers: (vouchers.data || []).map(normalizeVoucher),
    notifications: (notifications.data || []).map(normalizeNotification),
  };
}

export async function createCheckout(payload) {
  if (!isSupabaseConfigured) {
    const timestamp = Date.now();
    return {
      order_id: `demo-${timestamp}`,
      order_number: `PE-DEMO-${timestamp.toString().slice(-6)}`,
    };
  }
  const { data, error } = await supabase.rpc("create_customer_order", {
    checkout_payload: payload,
  });
  if (error) throw error;
  return data;
}

export async function simulatePayment(orderId, outcome) {
  if (!isSupabaseConfigured) {
    return { order_id: orderId, outcome, idempotent: true };
  }
  const { data, error } = await supabase.rpc("simulate_customer_payment", {
    target_order_id: orderId,
    outcome,
  });
  if (error) throw error;
  return data;
}
