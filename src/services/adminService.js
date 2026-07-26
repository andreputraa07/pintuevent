import { isSupabaseConfigured, supabase } from "./supabaseClient";
export async function getAdminDashboard(){if(!isSupabaseConfigured)return{mode:"demo",users:52481,events:1284,gtv:2800000000,pending:18};const{data,error}=await supabase.rpc("get_admin_dashboard");if(error)throw error;return data}
export async function adminAction(action,entityType,entityId,reason){if(!isSupabaseConfigured)return{action,entityType,entityId,reason,simulated:true};const{data,error}=await supabase.rpc("perform_admin_action",{action_name:action,target_type:entityType,target_id:entityId,action_reason:reason});if(error)throw error;return data}
export async function reviewEvent(eventId,decision,note){return runReview("review_event",{target_event_id:eventId,decision,review_note:note})}
export async function reviewOrganizer(organizerId,decision,note){return runReview("review_organizer",{target_organizer_id:organizerId,decision,review_note:note})}
export async function reviewRefund(refundId,decision,note){return runReview("review_refund",{target_refund_id:refundId,decision,review_note:note})}
export async function reviewWithdrawal(withdrawalId,decision,note,paymentRef=null){return runReview("review_withdrawal",{target_withdrawal_id:withdrawalId,decision,review_note:note,payment_ref:paymentRef})}
async function runReview(name,payload){if(!isSupabaseConfigured)return{name,...payload,simulated:true};const{data,error}=await supabase.rpc(name,payload);if(error)throw error;return data}
