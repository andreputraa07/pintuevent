export function authorizeSession(session, requiredRole) {
  if (!session) return { allowed: false, redirect: "/login" };
  if (session.status !== "active") return { allowed: false, redirect: "/account-suspended" };
  if (session.role !== requiredRole) return { allowed: false, redirect: "/unauthorized" };
  return { allowed: true, redirect: null };
}

export async function getAccessSession() {
  const { isSupabaseConfigured, supabase } = await import("./supabaseClient.js");
  if (!isSupabaseConfigured) {
    const raw = localStorage.getItem("pintuevent_session");
    return raw ? JSON.parse(raw) : null;
  }
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("id,full_name,avatar_url,role,status,organizer_verified").eq("id", user.id).single();
  if (profileError) throw profileError;
  return { ...profile, email: user.email };
}

export async function signIn(email, password, demoRole = "customer") {
  const { isSupabaseConfigured, supabase } = await import("./supabaseClient.js");
  if (!isSupabaseConfigured) {
    const session = { id: `demo-${demoRole}`, email, role: demoRole, status: "active" };
    localStorage.setItem("pintuevent_session", JSON.stringify(session));
    return session;
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return getAccessSession();
}

export async function signOut() {
  const { isSupabaseConfigured, supabase } = await import("./supabaseClient.js");
  localStorage.removeItem("pintuevent_session");
  if (isSupabaseConfigured) await supabase.auth.signOut();
}

export async function signUp(email, password, fullName) {
  const { isSupabaseConfigured, supabase } = await import("./supabaseClient.js");
  if (!isSupabaseConfigured) return signIn(email, password, "customer");
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
  if (error) throw error;
  return data;
}
