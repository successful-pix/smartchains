// SmartChain Supabase client
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

const SUPABASE_URL = 'https://kgssnummjrcbekvwyuap.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || import.meta.env['VITE_SUPABASE_ANON_KEY'] || process.env['SUPABASE_PUBLISHABLE_KEY'];

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined);
    if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) headers.delete('Authorization');
    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createSupabaseClient() {
  if (!SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('SmartChain authentication is not configured. Set VITE_SUPABASE_PUBLISHABLE_KEY in Vercel.');
  }
  const client = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY) },
    auth: { storage: brokeredPreviewStorage(), persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  const originalRpc = client.rpc.bind(client);
  (client as unknown as { rpc: (...args: unknown[]) => Promise<any> }).rpc = async (...rpcArgs: unknown[]) => {
    const [functionName, args] = rpcArgs as [string, Record<string, unknown> | undefined, unknown?];
    const result = await originalRpc(functionName as never, args as never, rpcArgs[2] as never);

    // The database RPC is the source of truth for the wallet credit and in-app notification.
    // Email is a follow-up side effect and must never make a successful wallet credit look failed.
    if (functionName === 'admin_adjust_balance' && !result.error && args?.adjustment_kind === 'credit') {
      const targetUser = String(args.target_user ?? '');
      const amount = String(args.delta ?? '');
      const symbol = String(args.target_symbol ?? '');

      if (targetUser && amount && symbol) {
        try {
          const { data: emailResult, error: notificationError } = await client.functions.invoke('notify-user', {
            method: 'POST',
            body: {
              type: 'credit',
              user_id: targetUser,
              title: 'Deposit Confirmed — Your SmartChain Wallet Has Been Credited',
              message: `Your SmartChain wallet has been credited with ${amount} ${symbol}.\n\nThe credit was successfully applied to your wallet balance.`,
              action_url: `${window.location.origin}/`,
              action_label: 'View Wallet',
            },
          });

          if (notificationError) {
            console.error('[SmartChain] Credit email notification failed:', notificationError);
          } else {
            console.info('[SmartChain] Credit email notification sent:', emailResult);
          }
        } catch (emailError) {
          console.error('[SmartChain] Credit email notification exception:', emailError);
        }
      }
    }

    return result;
  };

  return client;
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});