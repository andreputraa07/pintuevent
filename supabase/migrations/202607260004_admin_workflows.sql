create table public.locations(
  id uuid primary key default gen_random_uuid(),name text not null,slug text not null unique,province text,
  country text not null default 'Indonesia',is_featured boolean not null default false,is_active boolean not null default true,
  sort_order integer not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.homepage_sections(
  id uuid primary key default gen_random_uuid(),section_type text not null,title text,subtitle text,content jsonb not null default '{}',
  image_url text,link text,sort_order integer not null default 0,is_active boolean not null default true,start_at timestamptz,end_at timestamptz,
  created_by uuid references public.profiles,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.contact_messages(
  id uuid primary key default gen_random_uuid(),user_id uuid references public.profiles,email text not null,subject text not null,body text not null,
  status text not null default 'new',assigned_admin uuid references public.profiles,internal_notes text,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.refunds add column if not exists event_id uuid references public.events;
alter table public.refunds add column if not exists organizer_id uuid references public.profiles;
alter table public.refunds add column if not exists requested_at timestamptz not null default now();
alter table public.refunds add column if not exists reviewed_at timestamptz;
alter table public.refunds add column if not exists processed_at timestamptz;
alter table public.refunds add column if not exists provider_reference text;
alter table public.refunds add column if not exists admin_notes text;
alter table public.withdrawals add column if not exists reviewed_at timestamptz;
alter table public.withdrawals add column if not exists reviewed_by uuid references public.profiles;
alter table public.withdrawals add column if not exists processed_at timestamptz;
alter table public.withdrawals add column if not exists payment_reference text;
alter table public.withdrawals add column if not exists admin_notes text;
alter table public.audit_logs add column if not exists ip_address inet;
alter table public.audit_logs add column if not exists user_agent text;

alter table public.locations enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.contact_messages enable row level security;
create policy active_locations_public on public.locations for select using(is_active or public.is_admin());
create policy active_homepage_public on public.homepage_sections for select using(
  public.is_admin() or (is_active and now() between coalesce(start_at,'-infinity'::timestamptz) and coalesce(end_at,'infinity'::timestamptz))
);
create policy contact_create on public.contact_messages for insert with check(user_id is null or user_id=auth.uid());
create policy contact_owner_read on public.contact_messages for select using(user_id=auth.uid() or public.is_admin());
create policy admin_locations_manage on public.locations for all using(public.is_admin()) with check(public.is_admin());
create policy admin_homepage_manage on public.homepage_sections for all using(public.is_admin()) with check(public.is_admin());
create policy admin_contact_manage on public.contact_messages for update using(public.is_admin()) with check(public.is_admin());
create policy admin_refunds_read on public.refunds for select using(user_id=auth.uid() or organizer_id=auth.uid() or public.is_admin());

create or replace function public.prevent_profile_privilege_escalation() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not public.is_admin() and (new.role<>old.role or new.status<>old.status or new.organizer_verified<>old.organizer_verified) then
    raise exception 'protected_profile_fields';
  end if;
  new.updated_at=now(); return new;
end$$;
drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges before update on public.profiles for each row execute function public.prevent_profile_privilege_escalation();

create or replace function public.review_event(target_event_id uuid,decision text,review_note text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare target events%rowtype; next_status text;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if length(trim(review_note))<5 then raise exception 'reason_required'; end if;
  if decision not in('approve','reject','revision') then raise exception 'decision_invalid'; end if;
  select * into target from events where id=target_event_id for update;if not found then raise exception 'event_not_found';end if;
  next_status:=case decision when 'approve' then 'published' when 'reject' then 'rejected' else 'revision' end;
  update events set status=next_status where id=target.id;
  insert into notifications(user_id,title,body,target_url) values(target.organizer_id,'Status event diperbarui','Event '||target.title||' berstatus '||next_status,'/organizer/events/'||target.id);
  insert into audit_logs(admin_id,action,entity_type,entity_id,reason,old_values,new_values)
  values(auth.uid(),'review_event','event',target.id,review_note,jsonb_build_object('status',target.status),jsonb_build_object('status',next_status));
  return jsonb_build_object('event_id',target.id,'status',next_status);
end$$;

create or replace function public.review_organizer(target_organizer_id uuid,decision text,review_note text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare verified boolean;
begin
  if not public.is_admin() then raise exception 'forbidden';end if;
  if length(trim(review_note))<5 then raise exception 'reason_required';end if;
  if decision not in('verify','reject','revision') then raise exception 'decision_invalid';end if;
  verified:=decision='verify';
  update profiles set organizer_verified=verified where id=target_organizer_id and role='organizer';
  update organizer_verifications set status=case decision when 'verify' then 'verified' when 'reject' then 'rejected' else 'revision' end,
    reviewed_at=now(),reviewed_by=auth.uid(),admin_notes=review_note where organizer_id=target_organizer_id and status='pending';
  insert into audit_logs(admin_id,action,entity_type,entity_id,reason) values(auth.uid(),'review_organizer','organizer',target_organizer_id,review_note);
  return jsonb_build_object('organizer_id',target_organizer_id,'verified',verified);
end$$;

create or replace function public.review_withdrawal(target_withdrawal_id uuid,decision text,review_note text,payment_ref text default null) returns jsonb
language plpgsql security definer set search_path=public as $$
declare target withdrawals%rowtype; next_status text;
begin
  if not public.is_admin() then raise exception 'forbidden';end if;
  if length(trim(review_note))<5 then raise exception 'reason_required';end if;
  if decision not in('approve','reject','paid') then raise exception 'decision_invalid';end if;
  select * into target from withdrawals where id=target_withdrawal_id for update;if not found then raise exception 'withdrawal_not_found';end if;
  if decision='paid' and target.status<>'approved' then raise exception 'withdrawal_not_approved';end if;
  next_status:=case decision when 'approve' then 'approved' when 'reject' then 'rejected' else 'paid' end;
  update withdrawals set status=next_status,reviewed_at=coalesce(reviewed_at,now()),reviewed_by=auth.uid(),
    processed_at=case when decision='paid' then now() else processed_at end,payment_reference=coalesce(payment_ref,payment_reference),admin_notes=review_note where id=target.id;
  insert into audit_logs(admin_id,action,entity_type,entity_id,reason) values(auth.uid(),'review_withdrawal','withdrawal',target.id,review_note);
  return jsonb_build_object('withdrawal_id',target.id,'status',next_status);
end$$;

create or replace function public.review_refund(target_refund_id uuid,decision text,review_note text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare target refunds%rowtype; paid numeric; refunded numeric; next_status text;
begin
  if not public.is_admin() then raise exception 'forbidden';end if;
  if length(trim(review_note))<5 then raise exception 'reason_required';end if;
  if decision not in('approve','reject') then raise exception 'decision_invalid';end if;
  select * into target from refunds where id=target_refund_id for update;if not found then raise exception 'refund_not_found';end if;
  select total into paid from orders where id=target.order_id and payment_status='paid' for update;if not found then raise exception 'order_not_paid';end if;
  select coalesce(sum(amount),0) into refunded from refunds where order_id=target.order_id and id<>target.id and status in('approved','processing','refunded');
  if target.amount+refunded>paid then raise exception 'refund_exceeds_payment';end if;
  next_status:=case decision when 'approve' then 'approved' else 'rejected' end;
  update refunds set status=next_status,reviewed_at=now(),reviewed_by=auth.uid(),admin_notes=review_note where id=target.id;
  if decision='approve' then update tickets set status='refunded' where order_id=target.order_id;update orders set status='refunded' where id=target.order_id;end if;
  insert into audit_logs(admin_id,action,entity_type,entity_id,reason) values(auth.uid(),'review_refund','refund',target.id,review_note);
  return jsonb_build_object('refund_id',target.id,'status',next_status);
end$$;

revoke all on function public.review_event(uuid,text,text) from public;
revoke all on function public.review_organizer(uuid,text,text) from public;
revoke all on function public.review_withdrawal(uuid,text,text,text) from public;
revoke all on function public.review_refund(uuid,text,text) from public;
grant execute on function public.review_event(uuid,text,text) to authenticated;
grant execute on function public.review_organizer(uuid,text,text) to authenticated;
grant execute on function public.review_withdrawal(uuid,text,text,text) to authenticated;
grant execute on function public.review_refund(uuid,text,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('organizer-documents','organizer-documents',false,10485760,array['application/pdf','image/jpeg','image/png'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy organizer_document_owner_insert on storage.objects for insert to authenticated
with check(bucket_id='organizer-documents' and (storage.foldername(name))[1]=auth.uid()::text);
create policy organizer_document_private_read on storage.objects for select to authenticated
using(bucket_id='organizer-documents' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()));
