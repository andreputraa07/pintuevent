alter table public.profiles add column if not exists organizer_verified boolean not null default false;
create table public.organizer_members(
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles,
  user_id uuid not null references public.profiles,
  role text not null check(role in('owner','manager','finance','check_in_staff','viewer')),
  status text not null default 'pending' check(status in('pending','active','revoked')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(organizer_id,user_id)
);
create table public.organizer_verifications(
  id uuid primary key default gen_random_uuid(),organizer_id uuid not null references public.profiles,
  status text not null default 'pending',document_urls text[] not null default '{}',submitted_at timestamptz,
  reviewed_at timestamptz,reviewed_by uuid references public.profiles,rejection_reason text,admin_notes text,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.organizer_members enable row level security;
alter table public.organizer_verifications enable row level security;

create or replace function public.has_event_permission(target_event_id uuid,required_permission text default 'view')
returns boolean language sql stable security definer set search_path=public as $$
  select public.is_admin() or exists(select 1 from events e where e.id=target_event_id and e.organizer_id=auth.uid())
  or exists(
    select 1 from events e join organizer_members m on m.organizer_id=e.organizer_id
    where e.id=target_event_id and m.user_id=auth.uid() and m.status='active'
      and case required_permission
        when 'check_in' then m.role in('owner','manager','check_in_staff')
        when 'finance' then m.role in('owner','manager','finance')
        when 'manage' then m.role in('owner','manager')
        else m.role in('owner','manager','finance','check_in_staff','viewer') end
  )
$$;

drop policy if exists organizer_events on public.events;
create policy organizer_event_insert on public.events for insert with check(
  organizer_id=auth.uid() and public.has_role('organizer')
);
create policy organizer_event_update on public.events for update using(
  public.has_event_permission(id,'manage')
) with check(
  public.has_event_permission(id,'manage')
  and (status<>'published' or exists(select 1 from profiles p where p.id=organizer_id and p.organizer_verified))
);
create policy organizer_event_delete_draft on public.events for delete using(
  public.has_event_permission(id,'manage') and status='draft'
  and not exists(select 1 from ticket_types tt join order_items oi on oi.ticket_type_id=tt.id where tt.event_id=events.id)
);
create policy organizer_ticket_types_select on public.ticket_types for select using(public.has_event_permission(event_id,'view'));
create policy organizer_ticket_types_insert on public.ticket_types for insert with check(public.has_event_permission(event_id,'manage'));
create policy organizer_ticket_types_update on public.ticket_types for update using(public.has_event_permission(event_id,'manage'))
with check(public.has_event_permission(event_id,'manage') and quota>=sold);
create policy organizer_ticket_types_delete on public.ticket_types for delete using(
  public.has_event_permission(event_id,'manage') and not exists(select 1 from order_items oi where oi.ticket_type_id=ticket_types.id)
);
create policy organizer_orders_select on public.orders for select using(
  exists(select 1 from order_items oi join ticket_types tt on tt.id=oi.ticket_type_id where oi.order_id=orders.id and public.has_event_permission(tt.event_id,'view'))
);
create policy organizer_items_select on public.order_items for select using(
  exists(select 1 from ticket_types tt where tt.id=ticket_type_id and public.has_event_permission(tt.event_id,'view'))
);
create policy organizer_attendees_select on public.attendees for select using(
  exists(select 1 from order_items oi join ticket_types tt on tt.id=oi.ticket_type_id where oi.id=order_item_id and public.has_event_permission(tt.event_id,'view'))
);
create policy organizer_voucher_manage on public.vouchers for all using(
  organizer_id=auth.uid() or (event_id is not null and public.has_event_permission(event_id,'manage')) or public.is_admin()
) with check(
  organizer_id=auth.uid() and (event_id is null or public.has_event_permission(event_id,'manage'))
);
create policy organizer_members_read on public.organizer_members for select using(
  organizer_id=auth.uid() or user_id=auth.uid() or public.is_admin()
);
create policy organizer_members_manage on public.organizer_members for all using(
  organizer_id=auth.uid() or public.is_admin()
) with check(organizer_id=auth.uid() or public.is_admin());
create policy organizer_verification_read on public.organizer_verifications for select using(
  organizer_id=auth.uid() or public.is_admin()
);
create policy organizer_verification_submit on public.organizer_verifications for insert with check(
  organizer_id=auth.uid() and public.has_role('organizer')
);

create or replace view public.organizer_finance_summary with(security_invoker=true) as
select e.organizer_id,
  coalesce(sum(case when o.payment_status='paid' then o.subtotal else 0 end),0) gross,
  coalesce(sum(case when o.payment_status='paid' then o.service_fee else 0 end),0) service_fees,
  coalesce(sum(case when o.payment_status='paid' then o.total-o.service_fee else 0 end),0) net_before_refunds
from events e join ticket_types tt on tt.event_id=e.id join order_items oi on oi.ticket_type_id=tt.id
join orders o on o.id=oi.order_id group by e.organizer_id;

create or replace function public.request_withdrawal(requested_amount numeric,bank_name text,account_number text,account_name text)
returns uuid language plpgsql security definer set search_path=public as $$
declare available numeric; withdrawal_id uuid;
begin
  if not public.has_role('organizer') or not exists(select 1 from profiles where id=auth.uid() and organizer_verified) then raise exception 'organizer_not_verified'; end if;
  select coalesce(net_before_refunds,0)-coalesce((select sum(amount) from withdrawals where organizer_id=auth.uid() and status in('pending','approved','paid')),0)
  into available from organizer_finance_summary where organizer_id=auth.uid();
  if requested_amount<100000 or requested_amount>coalesce(available,0) then raise exception 'insufficient_balance'; end if;
  if exists(select 1 from withdrawals where organizer_id=auth.uid() and amount=requested_amount and status='pending') then raise exception 'duplicate_withdrawal'; end if;
  insert into withdrawals(organizer_id,amount,bank_name,account_number,account_name)
  values(auth.uid(),requested_amount,bank_name,account_number,account_name) returning id into withdrawal_id;
  return withdrawal_id;
end$$;
revoke all on function public.request_withdrawal(numeric,text,text,text) from public;
grant execute on function public.request_withdrawal(numeric,text,text,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('event-posters','event-posters',true,5242880,array['image/jpeg','image/png','image/webp']),
('event-banners','event-banners',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy organizer_event_media_insert on storage.objects for insert to authenticated with check(
  bucket_id in('event-posters','event-banners')
  and (storage.foldername(name))[1]=auth.uid()::text
  and public.has_event_permission(((storage.foldername(name))[2])::uuid,'manage')
);
create policy organizer_event_media_delete on storage.objects for delete to authenticated using(
  bucket_id in('event-posters','event-banners')
  and public.has_event_permission(((storage.foldername(name))[2])::uuid,'manage')
);
