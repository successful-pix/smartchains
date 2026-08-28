alter table public.coin_wallets add column if not exists qr_code_url text;
create index if not exists coin_wallets_asset_network_enabled_idx on public.coin_wallets (asset_id, network, enabled);
alter table public.coin_wallets drop constraint if exists coin_wallets_asset_network_unique;
alter table public.network_fees drop constraint if exists network_fees_network_unique;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('deposit-qr', 'deposit-qr', true, 5242880, array['image/png','image/jpeg','image/webp']::text[])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins upload deposit QR" on storage.objects
for insert to authenticated
with check (bucket_id = 'deposit-qr' and private.is_smartchain_admin());
create policy "Admins update deposit QR" on storage.objects
for update to authenticated
using (bucket_id = 'deposit-qr' and private.is_smartchain_admin())
with check (bucket_id = 'deposit-qr' and private.is_smartchain_admin());
create policy "Admins delete deposit QR" on storage.objects
for delete to authenticated
using (bucket_id = 'deposit-qr' and private.is_smartchain_admin());
create policy "Anyone can read deposit QR" on storage.objects
for select to public
using (bucket_id = 'deposit-qr');

create table if not exists public.trade_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id text not null,
  symbol text not null,
  side text not null check (side in ('long','short')),
  order_type text not null default 'market' check (order_type in ('market','limit')),
  quantity numeric not null check (quantity > 0),
  leverage numeric not null default 1 check (leverage >= 1 and leverage <= 125),
  entry_price numeric not null check (entry_price >= 0),
  limit_price numeric,
  take_profit numeric,
  stop_loss numeric,
  margin numeric,
  status text not null default 'pending' check (status in ('pending','open','closed','cancelled')),
  is_simulated boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (limit_price is null or limit_price > 0),
  check (take_profit is null or take_profit > 0),
  check (stop_loss is null or stop_loss > 0),
  check (margin is null or margin > 0)
);
create index if not exists trade_orders_user_created_idx on public.trade_orders (user_id, created_at desc);
create index if not exists trade_orders_asset_status_idx on public.trade_orders (asset_id, status);
alter table public.trade_orders enable row level security;
create policy "Users view own trade orders" on public.trade_orders for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users create own trade orders" on public.trade_orders for insert to authenticated with check ((select auth.uid()) = user_id and is_simulated = true);
create policy "Users cancel own pending trade orders" on public.trade_orders for update to authenticated using ((select auth.uid()) = user_id and status = 'pending') with check ((select auth.uid()) = user_id and status in ('pending','cancelled'));
create policy "Admins manage trade orders" on public.trade_orders for all to authenticated using (private.is_smartchain_admin()) with check (private.is_smartchain_admin());
create or replace function public.set_trade_order_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists trade_orders_updated_at on public.trade_orders;
create trigger trade_orders_updated_at before update on public.trade_orders for each row execute function public.set_trade_order_updated_at();
