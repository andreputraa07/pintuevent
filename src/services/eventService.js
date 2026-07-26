import { demoEvents } from "./demoData";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export async function listPublishedEvents(filters = {}) {
  if (!isSupabaseConfigured) {
    const query = String(filters.query || "").toLowerCase();
    return demoEvents.filter((event) => !query || event.title.toLowerCase().includes(query));
  }
  let request = supabase.from("events").select("*, categories(*), ticket_types(*)").eq("status", "published");
  if (filters.query) request = request.ilike("title", `%${filters.query}%`);
  const { data, error } = await request.order("starts_at");
  if (error) throw error;
  return data;
}

