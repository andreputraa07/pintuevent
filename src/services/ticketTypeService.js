import { isSupabaseConfigured, supabase } from "./supabaseClient.js";
export async function saveTicketType(payload) {
  if (!isSupabaseConfigured) {
    return { id: `demo-ticket-type-${Date.now()}`, ...payload };
  }
  const request = payload.id
    ? supabase.from("ticket_types").update(payload).eq("id", payload.id)
    : supabase.from("ticket_types").insert(payload);
  const { data, error } = await request.select().single();
  if (error) throw error;
  return data;
}

export async function deleteTicketType(id) {
  if (!isSupabaseConfigured) return true;
  const { error } = await supabase.from("ticket_types").delete().eq("id", id);
  if (error) throw error;
  return true;
}
