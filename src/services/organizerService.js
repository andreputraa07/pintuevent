import { isSupabaseConfigured, supabase } from "./supabaseClient";
export async function getOrganizerDashboard(organizerId){if(!isSupabaseConfigured)return{mode:"demo",totals:{events:12,sold:2648,gross:386000000}};const{data,error}=await supabase.rpc("get_organizer_dashboard",{target_organizer_id:organizerId});if(error)throw error;return data}
export async function createEventDraft(payload){if(!isSupabaseConfigured)return{id:`demo-event-${Date.now()}`,status:"draft",...payload};const{data,error}=await supabase.from("events").insert(payload).select().single();if(error)throw error;return data}
