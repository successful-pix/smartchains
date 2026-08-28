-- Enforce SmartChain account freezes at the database boundary.
-- Admin UI already toggles profiles.account_status between active and blocked.

create or replace function public.reject_blocked_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.profiles p
    where p.id = new.user_id
      and p.account_status = 'blocked'
  ) then
    raise exception 'Action can''t be done. Please contact support.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists transactions_reject_blocked on public.transactions;
create trigger transactions_reject_blocked
before insert or update on public.transactions
for each row execute function public.reject_blocked_transaction();

create or replace function public.reject_blocked_trade_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.profiles p
    where p.id = new.user_id
      and p.account_status = 'blocked'
  ) then
    raise exception 'Action can''t be done. Please contact support.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trade_orders_reject_blocked on public.trade_orders;
create trigger trade_orders_reject_blocked
before insert or update on public.trade_orders
for each row execute function public.reject_blocked_trade_order();

notify pgrst, 'reload schema';
