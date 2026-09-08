import { supabase } from "@/integrations/supabase/client";
import type { AppNotification, Profile, TransactionType, UserPreferences, WalletHolding, WalletTransaction } from "@/types/wallet";

const PREFERENCES_CACHE_KEY = "smartchain_preferences_cache";

type CachedPreferences = Pick<UserPreferences, "currency" | "hide_balance" | "notify_security" | "notify_transactions" | "notify_marketing">;

function readCachedPreferences(): CachedPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFERENCES_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedPreferences;
  } catch { return null; }
}

function cachePreferences(preferences: CachedPreferences) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(PREFERENCES_CACHE_KEY, JSON.stringify(preferences)); } catch { /* best effort */ }
}

export async function getHoldings(): Promise<WalletHolding[]> { const { data, error } = await supabase.from("wallet_holdings").select("id, asset_id, symbol, balance"); if (error) throw new Error(error.message); return (data ?? []).map((row) => ({ id: row.id, asset_id: row.asset_id, symbol: row.symbol, balance: Number(row.balance) })); }
export function subscribeToHoldings(onChange: () => void) { const channel = supabase.channel("wallet-holdings-live").on("postgres_changes", { event: "*", schema: "public", table: "wallet_holdings" }, onChange).subscribe(); return () => { void supabase.removeChannel(channel); }; }
export async function getTransactions(limit = 50): Promise<WalletTransaction[]> { const { data, error } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(limit); if (error) return []; return (data ?? []).map((row) => ({ id: row.id, type: row.type as TransactionType, asset_id: row.asset_id, symbol: row.symbol, amount: Number(row.amount), fiat_value: Number(row.fiat_value), status: row.status as WalletTransaction["status"], is_onchain: row.is_onchain, reference: row.reference, counterparty: row.counterparty, network: row.network, note: row.note, created_at: row.created_at })); }
export interface NewTransaction { type: TransactionType; asset_id: string; symbol: string; amount: number; fiat_value: number; counterparty?: string; network?: string; note?: string; }
const NATIVE_GAS_BY_NETWORK: Record<string, string> = { ethereum:"ETH",eth:"ETH",erc20:"ETH","ethereum-mainnet":"ETH",arbitrum:"ETH",optimism:"ETH",base:"ETH",polygon:"POL",matic:"POL",bsc:"BNB",bep20:"BNB",binance:"BNB",avalanche:"AVAX",avax:"AVAX" };
export function getNativeGasSymbol(network?: string | null) { return NATIVE_GAS_BY_NETWORK[(network ?? "ethereum").trim().toLowerCase()] ?? "ETH"; }
export async function assertAccountCanTransact() { const { data: auth } = await supabase.auth.getUser(); const userId = auth.user?.id; if (!userId) throw new Error("You must be signed in."); const { data: profile, error } = await supabase.from("profiles").select("account_status").eq("id", userId).maybeSingle(); if (error) throw new Error(error.message); if ((profile as { account_status?: string } | null)?.account_status === "blocked") throw new Error("Action can't be done. Please contact support."); return userId; }
export async function createTransactionRequest(input: NewTransaction) { const userId = await assertAccountCanTransact(); if (input.type === "send" || input.type === "withdraw") { const gasSymbol = getNativeGasSymbol(input.network); const { data: gasHolding, error: gasError } = await supabase.from("wallet_holdings").select("balance").eq("symbol", gasSymbol).maybeSingle(); if (gasError) throw new Error(gasError.message); if (!(Number(gasHolding?.balance ?? 0) > 0)) throw new Error(input.symbol.toUpperCase()==="USDT"&&/trc|tron/i.test(input.network??"")?"Insufficient Tron balance to cover gas fee.":input.symbol.toUpperCase()==="USDT"&&/erc|ethereum/i.test(input.network??"")?"Insufficient ETH balance to cover gas fee.":`Insufficient ${gasSymbol} balance to cover gas fee.`); } const { data, error } = await supabase.from("transactions").insert({ user_id:userId,type:input.type,asset_id:input.asset_id,symbol:input.symbol,amount:input.amount,fiat_value:input.fiat_value,status:"pending",is_onchain:false,counterparty:input.counterparty??null,network:input.network??null,note:input.note??null }).select("reference").single(); if (error) throw new Error(error.message); await supabase.from("notifications").insert({ user_id:userId,category:"transaction",title:`${input.type[0]!.toUpperCase()}${input.type.slice(1)} request created`,body:`${input.amount} ${input.symbol} · reference ${data.reference}. Pending — not broadcast to a blockchain network.` }); return data.reference as string; }
export async function getNotifications(): Promise<AppNotification[]> { const { data,error }=await supabase.from("notifications").select("*").order("created_at",{ascending:false}).limit(50);if(error)return [];return(data??[]) as AppNotification[]; }
export async function markNotificationRead(id:string){const{error}=await supabase.from("notifications").update({read:true}).eq("id",id);if(error)throw new Error(error.message)}
export async function markAllNotificationsRead(){const{error}=await supabase.from("notifications").update({read:true}).eq("read",false);if(error)throw new Error(error.message)}
export async function getProfile():Promise<Profile|null>{const{data,error}=await supabase.from("profiles").select("id, display_name, avatar_url, account_status").maybeSingle();if(error)throw new Error(error.message);return data as Profile|null}
export async function updateProfile(patch:{display_name?:string}){const{data:auth}=await supabase.auth.getUser();if(!auth.user)throw new Error("You must be signed in.");const{data,error}=await supabase.from("profiles").upsert({id:auth.user.id,...patch},{onConflict:"id",ignoreDuplicates:false}).select("id, display_name, avatar_url, account_status").single();if(error)throw new Error(`Unable to save display name: ${error.message}`);if(!data)throw new Error("Your profile could not be updated. Please sign in again.");return data as Profile;}
export async function getPreferences():Promise<UserPreferences|null>{const{data:auth}=await supabase.auth.getUser();if(!auth.user)return null;const{data,error}=await supabase.from("user_preferences").select("*").eq("user_id",auth.user.id).maybeSingle();if(error){const cached=readCachedPreferences();if(cached)return {...cached,user_id:auth.user.id} as UserPreferences;throw new Error(error.message)}if(!data){const cached=readCachedPreferences();return cached?({...cached,user_id:auth.user.id} as UserPreferences):null;}const preferences=data as UserPreferences;cachePreferences({currency:preferences.currency,hide_balance:preferences.hide_balance,notify_security:preferences.notify_security,notify_transactions:preferences.notify_transactions,notify_marketing:preferences.notify_marketing});return preferences;}
export async function updatePreferences(patch:Partial<UserPreferences>){const{data:auth}=await supabase.auth.getUser();if(!auth.user)throw new Error("You must be signed in.");const current=await getPreferences();const payload={user_id:auth.user.id,currency:patch.currency??current?.currency??"USD",hide_balance:patch.hide_balance??current?.hide_balance??false,notify_security:patch.notify_security??current?.notify_security??true,notify_transactions:patch.notify_transactions??current?.notify_transactions??true,notify_marketing:patch.notify_marketing??current?.notify_marketing??false};
  cachePreferences(payload);
  const { data: updated, error: updateError } = await supabase.from("user_preferences").update(payload).eq("user_id", auth.user.id).select("*").maybeSingle();
  if (updateError) throw new Error(`Unable to save settings: ${updateError.message}`);
  if (updated) { cachePreferences(updated as CachedPreferences); return updated as UserPreferences; }
  const { data: inserted, error: insertError } = await supabase.from("user_preferences").insert(payload).select("*").single();
  if (insertError) throw new Error(`Unable to save settings: ${insertError.message}`);
  cachePreferences(inserted as CachedPreferences);
  return inserted as UserPreferences;
}
