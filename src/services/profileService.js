import { isSupabaseConfigured, supabase } from "./supabaseClient";
export function validateAvatar(file) {
  if (!file) return null;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "Gunakan JPG, PNG, atau WebP.";
  if (file.size > 2 * 1024 * 1024) return "Ukuran avatar maksimal 2 MB.";
  return null;
}
export async function updateProfile(userId, changes) {
  if (!isSupabaseConfigured) return { id: userId, ...changes };
  const { data, error } = await supabase.from("profiles").update(changes).eq("id", userId).select().single();
  if (error) throw error;
  return data;
}
