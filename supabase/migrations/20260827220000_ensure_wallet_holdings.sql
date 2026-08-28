-- Ensure the wallet holdings table exists in the connected Supabase project.
-- The dashboard reads this table for balances; if it is missing, the holdings
-- query fails and the entire Assets list can appear empty even when market data
-- is available.

create table if not exists public.wallet_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id text not null,
  symbol text not null,
  balance numeric(38,18) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep one balance row per user/asset. A unique index is also sufficient for
-- the ON CONFLICT (user_id, asset_id) used by admin balance adjustments.
create unique index if not exists wallet_holdings_user_asset_uidx
  on public.wallet_holdings (user_id, asset_id);

-- Match the access model expected by the wallet service.
grant select, insert, update, delete on public.wallet_holdings to authenticated;
grant all on public.wallet_holdings to service_role;

alter table public.wallet_holdings enable row level security;

drop policy if exists "own holdings" on public.wallet_holdings;
create policy "own holdings"
on public.wallet_holdings
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Tell PostgREST to refresh its schema cache immediately after this migration.
notify pgrst, 'reload schema';
