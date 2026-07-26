import { isSupabaseConfigured, supabase } from "./supabaseClient";

export async function addFavorite(userId, eventId) {
  if (!isSupabaseConfigured) return { user_id: userId, event_id: eventId };
  const { data, error } = await supabase.from("favorites").upsert({ user_id: userId, event_id: eventId }, { onConflict: "user_id,event_id" }).select().single();
  if (error) throw error;
  return data;
}

export async function removeFavorite(userId, eventId) {
  if (!isSupabaseConfigured) return true;
  const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("event_id", eventId);
  if (error) throw error;
  return true;
}

