import { isSupabaseConfigured, supabase } from "./supabaseClient.js";
export async function markNotificationRead(userId, id) {
  if (!isSupabaseConfigured) return true;
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
  return true;
}
