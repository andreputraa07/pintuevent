import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (request) => {
  if (request.method !== "POST")
    return new Response("Method not allowed", { status: 405 });
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = request.headers.get("Authorization");
  if (!url || !serviceKey || !authHeader)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const { data: caller } = await admin.auth.getUser(token);
  if (!caller.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await admin
    .from("profiles")
    .select("role,status")
    .eq("id", caller.user.id)
    .single();
  if (profile?.role !== "admin" || profile.status !== "active")
    return Response.json({ error: "Forbidden" }, { status: 403 });
  const { userId, action, reason } = await request.json();
  if (
    !userId ||
    !["suspend", "reactivate"].includes(action) ||
    String(reason || "").trim().length < 5
  )
    return Response.json({ error: "Invalid request" }, { status: 400 });
  const status = action === "suspend" ? "suspended" : "active";
  const { error } = await admin
    .from("profiles")
    .update({ status })
    .eq("id", userId);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  await admin.from("audit_logs").insert({
    admin_id: caller.user.id,
    action,
    entity_type: "user",
    entity_id: userId,
    reason,
  });
  return Response.json({ userId, status });
});
