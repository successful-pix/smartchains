import { supabase } from "@/integrations/supabase/client";

export type WalletConfigInput = {
  asset_id: string;
  network: string;
  address: string;
  qr_url?: string | null;
};

/** Persist a wallet configuration and verify the exact row was written. */
export async function saveWalletConfiguration(input: WalletConfigInput) {
  const address = input.address.trim();
  if (!input.asset_id || !input.network) throw new Error("Select a coin and network.");
  if (!address) throw new Error("Enter a wallet address.");

  const payload = {
    asset_id: input.asset_id,
    network: input.network,
    address,
    qr_url: input.qr_url ?? null,
  };

  const { data, error } = await supabase
    .from("wallet_configurations")
    .upsert(payload, { onConflict: "asset_id,network" })
    .select("id, asset_id, network, address, qr_url")
    .single();

  if (error) throw new Error(`Unable to save wallet configuration: ${error.message}`);
  if (!data || data.address !== address) throw new Error("Wallet configuration could not be verified after saving.");

  const { data: verified, error: verifyError } = await supabase
    .from("wallet_configurations")
    .select("id, asset_id, network, address, qr_url")
    .eq("asset_id", input.asset_id)
    .eq("network", input.network)
    .maybeSingle();

  if (verifyError) throw new Error(`Wallet was saved but could not be verified: ${verifyError.message}`);
  if (!verified || verified.address !== address) throw new Error("Wallet address was not persisted. Please try again.");
  return verified;
}
