-- SmartChain admin controls, deposit wallets, gas fees and support chat.
-- Apply this migration to the connected Supabase project before using the new admin/support screens.

alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists account_status text not null default 'active';
alter table public.profiles add column if not exists kyc_status text not null default 'not_started';

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create table if not exists public.coin_wallets (
  asset_id text primary key,
  symbol text not null,
  name text not null,
  network text not null,
  deposit_address text,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.network_fees (
  network text primary key,
  fee_amount numeric(30,12) not null default 0,
  fee_currency text not null default 'USD',
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null default 'Support request',
  status text not null default 'open' check (status in ('open','pending','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text,
  attachment_path text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  constraint support_message_has_content check (coalesce(length(trim(message)),0) > 0 or attachment_path is not null)
);

create table if not exists public.admin_balance_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id text not null,
  symbol text not null,
  amount numeric(30,12) not null,
  kind text not null check (kind in ('credit','debit','debt')),
  note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace function public.admin_adjust_balance(
  target_user uuid,
  target_asset_id text,
  target_symbol text,
  delta numeric,
  adjustment_kind text,
  adjustment_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if adjustment_kind not in ('credit','debit','debt') then raise exception 'Invalid adjustment type'; end if;
  if delta <= 0 then raise exception 'Amount must be greater than zero'; end if;

  insert into public.wallet_holdings(user_id, asset_id, symbol, balance)
  values (target_user, target_asset_id, target_symbol, case when adjustment_kind='credit' then delta else 0 end)
  on conflict (user_id, asset_id) do update
    set balance = greatest(0, public.wallet_holdings.balance + case when adjustment_kind='credit' then delta else -delta end);

  insert into public.admin_balance_adjustments(user_id, asset_id, symbol, amount, kind, note, created_by)
  values (target_user, target_asset_id, target_symbol, delta, adjustment_kind, adjustment_note, auth.uid());
end;
$$;

alter table public.coin_wallets enable row level security;
alter table public.network_fees enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.admin_balance_adjustments enable row level security;

drop policy if exists coin_wallets_read on public.coin_wallets;
create policy coin_wallets_read on public.coin_wallets for select using (enabled = true or public.is_admin());
drop policy if exists coin_wallets_admin_write on public.coin_wallets;
create policy coin_wallets_admin_write on public.coin_wallets for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists network_fees_read on public.network_fees;
create policy network_fees_read on public.network_fees for select using (enabled = true or public.is_admin());
drop policy if exists network_fees_admin_write on public.network_fees;
create policy network_fees_admin_write on public.network_fees for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists support_tickets_user on public.support_tickets;
create policy support_tickets_user on public.support_tickets for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists support_tickets_insert on public.support_tickets;
create policy support_tickets_insert on public.support_tickets for insert with check (user_id = auth.uid());
drop policy if exists support_tickets_update on public.support_tickets;
create policy support_tickets_update on public.support_tickets for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

drop policy if exists support_messages_read on public.support_messages;
create policy support_messages_read on public.support_messages for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists support_messages_insert on public.support_messages;
create policy support_messages_insert on public.support_messages for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists admin_adjustments_admin_read on public.admin_balance_adjustments;
create policy admin_adjustments_admin_read on public.admin_balance_adjustments for select using (public.is_admin());

insert into storage.buckets (id, name, public) values ('support-attachments', 'support-attachments', false) on conflict (id) do nothing;

drop policy if exists support_attachment_upload on storage.objects;
create policy support_attachment_upload on storage.objects for insert to authenticated with check (bucket_id = 'support-attachments' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists support_attachment_read on storage.objects;
create policy support_attachment_read on storage.objects for select to authenticated using (bucket_id = 'support-attachments' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- Seed common networks only; wallet addresses remain intentionally empty until an administrator configures them.
insert into public.network_fees(network, fee_amount, fee_currency) values
 ('Ethereum', 0, 'USD'), ('Bitcoin', 0, 'USD'), ('BNB Smart Chain', 0, 'USD'), ('Polygon', 0, 'USD'), ('Solana', 0, 'USD'), ('TRON', 0, 'USD')
on conflict (network) do nothing;
