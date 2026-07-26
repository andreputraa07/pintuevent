import { isSupabaseConfigured, supabase } from "./supabaseClient.js";
export function validateAvatar(file) {
  if (!file) return null;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return "Gunakan JPG, PNG, atau WebP.";
  if (file.size > 2 * 1024 * 1024) return "Ukuran avatar maksimal 2 MB.";
  return null;
}
export async function updateProfile(userId, changes) {
  if (!isSupabaseConfigured) return { id: userId, ...changes };
  const { data, error } = await supabase
    .from("profiles")
    .update(changes)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function uploadAvatar(userId, file, previousUrl) {
  const validation = validateAvatar(file);
  if (validation) throw new Error(validation);
  if (!isSupabaseConfigured) return URL.createObjectURL(file);
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${userId}/avatar-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: false });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  await updateProfile(userId, { avatar_url: data.publicUrl });
  if (previousUrl) {
    const marker = "/avatars/";
    const previousPath = previousUrl.includes(marker)
      ? previousUrl.split(marker)[1]
      : null;
    if (previousPath)
      await supabase.storage.from("avatars").remove([previousPath]);
  }
  return data.publicUrl;
}
export async function requestEmailChange(email) {
  if (!isSupabaseConfigured)
    throw new Error("Perubahan email tidak tersedia pada mode demo.");
  const { error } = await supabase.auth.updateUser({ email });
  if (error) throw error;
  return true;
}
