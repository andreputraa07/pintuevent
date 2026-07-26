import { demoEvents } from "./demoData.js";
import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

export async function listPublishedEvents(filters = {}) {
  if (!isSupabaseConfigured) {
    const query = String(filters.query || "").toLowerCase();
    const city = String(filters.city || "").toLowerCase();
    const category = String(filters.category || "").toLowerCase();
    return demoEvents.filter(
      (event) =>
        (!query || event.title.toLowerCase().includes(query)) &&
        (!city || event.city.toLowerCase() === city) &&
        (!category || event.category.toLowerCase() === category),
    );
  }
  let request = supabase
    .from("events")
    .select("*, ticket_types(*)")
    .eq("status", "published");
  if (filters.query) request = request.ilike("title", `%${filters.query}%`);
  if (filters.city) request = request.eq("city", filters.city);
  if (filters.category) request = request.eq("category", filters.category);
  const { data, error } = await request.order("starts_at");
  if (error) throw error;
  return data;
}
