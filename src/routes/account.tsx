import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LogOut, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useProfile, usePreferences } from "@/hooks/useWalletData";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account")({ component: Account });

function Account() {
  const profile = useProfile();
  const prefs = usePreferences();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // Session is available immediately after authentication and avoids showing
    // a misleading "Loading email" placeholder on the Account page.
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setEmail(data.session?.user?.email ?? null);
      if (data.session?.user?.email || !active) return;
      void supabase.auth.getUser().then(({ data: userData }) => {
        if (active) setEmail(userData.user?.email ?? null);
      });
    });
    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("You have been signed out");
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="mx-auto max-w-lg px-4 pb-24 pt-5">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={17} />Dashboard
      </Link>
      <h1 className="mt-5 text-2xl font-semibold">Account</h1>
      <div className="mt-5 space-y-5 rounded-2xl border border-border bg-card p-5">
        <div>
          <p className="text-xs text-muted-foreground">Name</p>
          <p className="font-medium">{profile.data?.display_name || "SmartChain user"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="flex items-center gap-2 break-all font-medium">
            <Mail size={16} className="shrink-0 text-primary" />
            {email ?? "No email available"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Currency</p>
          <p className="font-medium">{prefs.data?.currency || "USD"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Security notifications</p>
          <p className="font-medium">{prefs.data?.notify_security ? "Enabled" : "Disabled"}</p>
        </div>
        <button type="button" disabled={signingOut} onClick={() => void signOut()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 px-4 py-3 text-sm font-semibold text-destructive disabled:opacity-60">
          <LogOut size={17} />{signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </main>
  );
}
