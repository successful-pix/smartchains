import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { usePreferences, useProfile } from "@/hooks/useWalletData";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({ component: Settings });

function Settings() {
  const profile = useProfile();
  const prefs = usePreferences();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [security, setSecurity] = useState(true);
  const [transactions, setTransactions] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (profile.data?.display_name) setName(profile.data.display_name); }, [profile.data?.display_name]);
  useEffect(() => { if (prefs.data) { setCurrency(prefs.data.currency); setSecurity(prefs.data.notify_security); setTransactions(prefs.data.notify_transactions); } }, [prefs.data]);

  async function save() {
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("You must be signed in.");
      const { error: profileError } = await supabase.from("profiles").update({ display_name: name.trim() || "SmartChain user" }).eq("id", auth.user.id);
      if (profileError) throw profileError;
      const { error: prefError } = await supabase.from("user_preferences").upsert({ user_id: auth.user.id, currency, notify_security: security, notify_transactions: transactions }, { onConflict: "user_id" });
      if (prefError) throw prefError;
      await Promise.all([profile.refetch(), prefs.refetch()]);
      toast.success("Settings saved");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save settings"); }
    finally { setSaving(false); }
  }

  return <main className="mx-auto max-w-lg px-4 pb-24 pt-5"><Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft size={17} /> Dashboard</Link><h1 className="mt-5 text-2xl font-semibold">Settings</h1><p className="mt-1 text-sm text-muted-foreground">Manage your SmartChain account preferences.</p><section className="mt-5 space-y-5 rounded-2xl border border-border bg-card p-5"><label className="block text-sm font-medium">Display name<input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3" placeholder="Your name" /></label><label className="block text-sm font-medium">Currency<select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3"><option>USD</option><option>EUR</option><option>GBP</option><option>NGN</option></select></label><label className="flex items-center justify-between gap-4 rounded-xl bg-secondary p-4"><span><b className="block text-sm">Security notifications</b><span className="text-xs text-muted-foreground">Alerts about account security.</span></span><input type="checkbox" checked={security} onChange={(e) => setSecurity(e.target.checked)} className="size-5 accent-primary" /></label><label className="flex items-center justify-between gap-4 rounded-xl bg-secondary p-4"><span><b className="block text-sm">Transaction notifications</b><span className="text-xs text-muted-foreground">Updates when wallet requests are created.</span></span><input type="checkbox" checked={transactions} onChange={(e) => setTransactions(e.target.checked)} className="size-5 accent-primary" /></label><button type="button" disabled={saving} onClick={() => void save()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50">{saving ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}{saving ? "Saving…" : "Save settings"}</button></section><Link to="/kyc" className="mt-4 block rounded-2xl border border-border bg-card p-4 hover:bg-secondary"><b>KYC verification</b><span className="mt-1 block text-sm text-muted-foreground">Verify your identity and manage your verification status.</span></Link></main>;
}
