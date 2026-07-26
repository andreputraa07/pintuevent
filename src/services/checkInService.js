import { isSupabaseConfigured, supabase } from "./supabaseClient";
export async function checkInTicket(eventId,qrValue){if(!isSupabaseConfigured)return{status:"valid",event_id:eventId,qr_value:qrValue};const{data,error}=await supabase.rpc("check_in_ticket",{target_event_id:eventId,scanned_qr:qrValue});if(error)throw error;return data}
