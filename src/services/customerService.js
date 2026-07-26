import { isSupabaseConfigured, supabase } from "./supabaseClient";
import { demoEvents, demoNotifications, demoOrders, demoTickets, demoVouchers } from "./demoData";

const demoProfile = { id: "demo-customer", full_name: "André Putra", email: "customer@pintuevent.my.id", phone: "0812-0000-2026", role: "customer", status: "active", avatar_url: null };

export async function getCustomerSnapshot(userId) {
  if (!isSupabaseConfigured) {
    return { mode: "demo", profile: demoProfile, events: demoEvents, orders: demoOrders, tickets: demoTickets, vouchers: demoVouchers, notifications: demoNotifications };
  }
  const [profile, orders, tickets, vouchers, notifications] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("orders").select("*, events(*), order_items(*)").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("tickets").select("*, events(*), ticket_types(*)").eq("user_id", userId),
    supabase.from("voucher_usages").select("*, vouchers(*)").eq("user_id", userId),
    supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);
  const error = [profile, orders, tickets, vouchers, notifications].find((item) => item.error)?.error;
  if (error) throw error;
  return { mode: "supabase", profile: profile.data, events: [], orders: orders.data, tickets: tickets.data, vouchers: vouchers.data, notifications: notifications.data };
}

export async function createCheckout(payload) {
  if (!isSupabaseConfigured) return { order_id: `demo-${Date.now()}`, order_number: `PE-DEMO-${Date.now().toString().slice(-6)}` };
  const { data, error } = await supabase.rpc("create_customer_order", { checkout_payload: payload });
  if (error) throw error;
  return data;
}

export async function simulatePayment(orderId, outcome) {
  if (!isSupabaseConfigured) return { order_id: orderId, outcome, idempotent: true };
  const { data, error } = await supabase.rpc("simulate_customer_payment", { target_order_id: orderId, outcome });
  if (error) throw error;
  return data;
}

