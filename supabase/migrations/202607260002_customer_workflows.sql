create table public.categories(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0
);
create or replace function public.handle_new_auth_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id,full_name,role,status) values(new.id,coalesce(nullif(new.raw_user_meta_data->>'full_name',''),split_part(new.email,'@',1)),'customer','active');
  return new;
end$$;
drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup after insert on auth.users for each row execute function public.handle_new_auth_user();
create table public.voucher_usages(
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references public.vouchers,
  user_id uuid not null references public.profiles,
  order_id uuid not null references public.orders,
  discount numeric(14,2) not null check(discount >= 0),
  created_at timestamptz not null default now(),
  unique(voucher_id, order_id)
);
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists expires_at timestamptz;
create unique index if not exists tickets_one_per_attendee on public.tickets(attendee_id) where attendee_id is not null;

alter table public.categories enable row level security;
alter table public.voucher_usages enable row level security;
alter table public.ticket_types enable row level security;
alter table public.vouchers enable row level security;
create policy active_categories_read on public.categories for select using(is_active or public.is_admin());
create policy own_voucher_usages_read on public.voucher_usages for select using(user_id=auth.uid() or public.is_admin());
create policy public_ticket_types_read on public.ticket_types for select using(
  exists(select 1 from public.events e where e.id=event_id and e.status='published')
  or exists(select 1 from public.events e where e.id=event_id and(e.organizer_id=auth.uid() or public.is_admin()))
);
create policy organizer_vouchers_read on public.vouchers for select using(
  is_active or organizer_id=auth.uid() or public.is_admin()
);

create or replace view public.event_catalog
with (security_invoker=true) as
select e.id,e.organizer_id,e.title,e.slug,e.status,e.category,e.city,e.location,
  e.starts_at,e.ends_at,e.created_at,
  case when exists(
    select 1 from public.tickets t
    where t.event_id=e.id and t.user_id=auth.uid() and t.status in ('active','checked_in')
  ) then e.online_url else null end as online_url
from public.events e
where e.status='published';

create or replace function public.create_customer_order(checkout_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  current_profile profiles%rowtype;
  event_row events%rowtype;
  ticket_request jsonb;
  ticket_row ticket_types%rowtype;
  new_order orders%rowtype;
  new_item_id uuid;
  attendee jsonb;
  requested_quantity integer;
  computed_subtotal numeric(14,2):=0;
  computed_discount numeric(14,2):=0;
  computed_fee numeric(14,2):=0;
  voucher_row vouchers%rowtype;
  voucher_code text:=nullif(upper(trim(checkout_payload->>'voucher_code')),'');
begin
  select * into current_profile from profiles where id=auth.uid() for share;
  if not found or current_profile.role<>'customer' or current_profile.status<>'active' then raise exception 'customer_not_allowed'; end if;
  select * into event_row from events where id=(checkout_payload->>'event_id')::uuid and status='published' for share;
  if not found then raise exception 'event_unavailable'; end if;
  if event_row.ends_at is not null and event_row.ends_at<=now() then raise exception 'event_completed'; end if;
  if jsonb_array_length(coalesce(checkout_payload->'tickets','[]'::jsonb))=0 then raise exception 'ticket_required'; end if;

  for ticket_request in select * from jsonb_array_elements(checkout_payload->'tickets') loop
    requested_quantity:=(ticket_request->>'quantity')::integer;
    select * into ticket_row from ticket_types
      where id=(ticket_request->>'ticket_type_id')::uuid and event_id=event_row.id and is_active for update;
    if not found then raise exception 'ticket_type_invalid'; end if;
    if now() not between coalesce(ticket_row.sales_start,'-infinity'::timestamptz) and coalesce(ticket_row.sales_end,'infinity'::timestamptz) then raise exception 'sales_period_invalid'; end if;
    if requested_quantity<ticket_row.min_purchase or requested_quantity>ticket_row.max_purchase then raise exception 'quantity_invalid'; end if;
    if ticket_row.sold+requested_quantity>ticket_row.quota then raise exception 'stock_unavailable'; end if;
    if jsonb_array_length(coalesce(ticket_request->'attendees','[]'::jsonb))<>requested_quantity then raise exception 'attendee_count_invalid'; end if;
    computed_subtotal:=computed_subtotal+(ticket_row.price*requested_quantity);
  end loop;

  if voucher_code is not null then
    select * into voucher_row from vouchers where code=voucher_code and is_active for update;
    if not found or (voucher_row.event_id is not null and voucher_row.event_id<>event_row.id)
      or now() not between coalesce(voucher_row.starts_at,'-infinity'::timestamptz) and coalesce(voucher_row.ends_at,'infinity'::timestamptz)
      or computed_subtotal<voucher_row.minimum or (voucher_row.quota is not null and voucher_row.used>=voucher_row.quota)
      or (select count(*) from voucher_usages where voucher_id=voucher_row.id and user_id=auth.uid())>=voucher_row.per_user_limit
    then raise exception 'voucher_invalid'; end if;
    computed_discount:=case when voucher_row.discount_type='percentage'
      then computed_subtotal*(least(voucher_row.discount_value,100)/100)
      else least(voucher_row.discount_value,computed_subtotal) end;
    computed_discount:=least(computed_discount,coalesce(voucher_row.max_discount,computed_discount));
  end if;
  computed_fee:=round((computed_subtotal-computed_discount)*0.05,2);
  insert into orders(order_number,user_id,status,payment_status,subtotal,discount,service_fee,total,payment_method,expires_at)
  values('PE-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISS')||'-'||upper(substr(encode(gen_random_bytes(3),'hex'),1,6)),auth.uid(),'pending','pending',
    computed_subtotal,computed_discount,computed_fee,computed_subtotal-computed_discount+computed_fee,
    checkout_payload->>'payment_method',now()+interval '30 minutes') returning * into new_order;
  for ticket_request in select * from jsonb_array_elements(checkout_payload->'tickets') loop
    requested_quantity:=(ticket_request->>'quantity')::integer;
    select * into ticket_row from ticket_types where id=(ticket_request->>'ticket_type_id')::uuid for update;
    insert into order_items(order_id,ticket_type_id,quantity,unit_price) values(new_order.id,ticket_row.id,requested_quantity,ticket_row.price) returning id into new_item_id;
    for attendee in select * from jsonb_array_elements(ticket_request->'attendees') loop
      insert into attendees(order_item_id,full_name,email,phone,identity_number)
      values(new_item_id,attendee->>'full_name',attendee->>'email',attendee->>'phone',attendee->>'identity_number');
    end loop;
    update ticket_types set sold=sold+requested_quantity where id=ticket_row.id;
  end loop;
  if voucher_code is not null then
    update vouchers set used=used+1 where id=voucher_row.id;
    insert into voucher_usages(voucher_id,user_id,order_id,discount) values(voucher_row.id,auth.uid(),new_order.id,computed_discount);
  end if;
  return jsonb_build_object('order_id',new_order.id,'order_number',new_order.order_number,'total',new_order.total,'expires_at',new_order.expires_at);
end$$;

create or replace function public.simulate_customer_payment(target_order_id uuid,outcome text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare target orders%rowtype; attendee_row record;
begin
  select * into target from orders where id=target_order_id and user_id=auth.uid() for update;
  if not found then raise exception 'order_not_found'; end if;
  if outcome not in('success','failed','expired') then raise exception 'outcome_invalid'; end if;
  if target.payment_status='paid' then return jsonb_build_object('order_id',target.id,'payment_status','paid','idempotent',true); end if;
  if outcome='success' then
    if target.expires_at<now() then raise exception 'order_expired'; end if;
    update orders set payment_status='paid',status='paid',paid_at=now() where id=target.id;
    for attendee_row in select a.*,oi.ticket_type_id,tt.event_id from attendees a join order_items oi on oi.id=a.order_item_id join ticket_types tt on tt.id=oi.ticket_type_id where oi.order_id=target.id loop
      insert into tickets(order_id,user_id,event_id,ticket_type_id,attendee_id,code,qr_value)
      values(target.id,target.user_id,attendee_row.event_id,attendee_row.ticket_type_id,attendee_row.id,
        'PINTU-'||upper(substr(encode(gen_random_bytes(8),'hex'),1,12)),encode(gen_random_bytes(24),'hex'))
      on conflict(attendee_id) where attendee_id is not null do nothing;
    end loop;
    insert into notifications(user_id,title,body,target_url) values(target.user_id,'Pembayaran berhasil','Tiket Anda telah diterbitkan.','/dashboard/tickets');
  elsif outcome='expired' then update orders set payment_status='expired',status='expired' where id=target.id;
  else update orders set payment_status='failed' where id=target.id; end if;
  return jsonb_build_object('order_id',target.id,'payment_status',(select payment_status from orders where id=target.id),'idempotent',false);
end$$;

revoke all on function public.create_customer_order(jsonb) from public;
revoke all on function public.simulate_customer_payment(uuid,text) from public;
grant execute on function public.create_customer_order(jsonb) to authenticated;
grant execute on function public.simulate_customer_payment(uuid,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('avatars','avatars',true,2097152,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy avatar_upload_own on storage.objects for insert to authenticated
with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy avatar_update_own on storage.objects for update to authenticated
using(bucket_id='avatars' and owner_id=auth.uid()::text);
create policy avatar_delete_own on storage.objects for delete to authenticated
using(bucket_id='avatars' and owner_id=auth.uid()::text);
