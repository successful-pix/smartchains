import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/kyc")({ component: Kyc });

function Kyc() {
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [address, setAddress] = useState("");
  const [documentType, setDocumentType] = useState("national_id");
  const [documentNumber, setDocumentNumber] = useState("");
  const [status, setStatus] = useState("not_started");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
      const profile = data as { full_name?: string | null; country?: string | null; kyc_status?: string | null } | null;
      if (profile?.full_name) setFullName(profile.full_name);
      if (profile?.country) setCountry(profile.country);
      if (profile?.kyc_status) setStatus(profile.kyc_status);
    })();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("You must be signed in to complete KYC.");
      const submission = { user_id: auth.user.id, full_name: fullName.trim(), date_of_birth: dateOfBirth, country, address: address.trim(), document_type: documentType, document_number: documentNumber.trim(), status: "pending" };
      const { error } = await supabase.from("kyc_submissions" as never).insert(submission as never);
      if (error) throw error;
      const { error: profileError } = await supabase.from("profiles").update({ kyc_status: "pending" } as never).eq("id", auth.user.id);
      if (profileError) throw profileError;
      setStatus("pending");
      toast.success("KYC submitted", { description: "Your verification request is now pending review." });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to submit KYC"); }
    finally { setLoading(false); }
  }

  if (status === "pending" || status === "approved") return <main className="mx-auto max-w-lg px-4 pb-24 pt-5"><Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft size={17} /> Dashboard</Link><section className="mt-8 rounded-3xl border border-border bg-card p-7 text-center"><CheckCircle2 className="mx-auto text-primary" size={52} /><h1 className="mt-4 text-2xl font-semibold">{status === "approved" ? "KYC approved" : "KYC under review"}</h1><p className="mt-2 text-sm text-muted-foreground">{status === "approved" ? "Your identity verification has been approved." : "We received your verification details. Your submission is pending review."}</p><Link to="/settings" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Back to settings</Link></section></main>;

  return <main className="mx-auto max-w-lg px-4 pb-24 pt-5"><Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft size={17} /> Dashboard</Link><h1 className="mt-5 text-2xl font-semibold">KYC verification</h1><p className="mt-1 text-sm text-muted-foreground">Submit your identity details for account verification.</p><form onSubmit={(e) => void submit(e)} className="mt-5 space-y-4 rounded-2xl border border-border bg-card p-5"><label className="block text-sm font-medium">Full legal name<input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3" /></label><label className="block text-sm font-medium">Date of birth<input required type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3" /></label><label className="block text-sm font-medium">Country<select value={country} onChange={(e) => setCountry(e.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3"><option>Nigeria</option><option>United States</option><option>United Kingdom</option><option>South Africa</option><option>Ghana</option><option>Kenya</option><option>United Arab Emirates</option></select></label><label className="block text-sm font-medium">Residential address<textarea required value={address} onChange={(e) => setAddress(e.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-input bg-background px-3 py-3" /></label><label className="block text-sm font-medium">Document type<select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3"><option value="national_id">National ID</option><option value="passport">Passport</option><option value="drivers_license">Driver's license</option></select></label><label className="block text-sm font-medium">Document number<input required value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3" /></label><p className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground">Your submission is protected by row-level access controls. This page records verification details for review; it does not independently verify government documents.</p><button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50">{loading && <Loader2 size={17} className="animate-spin" />}{loading ? "Submitting…" : "Submit KYC"}</button></form></main>;
}
