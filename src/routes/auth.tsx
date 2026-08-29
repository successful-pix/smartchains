import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { loadCountries, type Country } from "@/data/countries";

export const Route = createFileRoute("/auth")({ component: Auth });
type Mode = "login" | "signup" | "verify" | "reset";
const OTP_KIND_KEY = "smartchain_otp_kind";
const OTP_EMAIL_KEY = "smartchain_otp_email";
const LOGIN_PASSWORD_KEY = "smartchain_pending_password";

function withTimeout<T>(promise: PromiseLike<T>, ms = 20000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("The request timed out. Please check your connection and try again.")), ms);
    Promise.resolve(promise).then(v => { window.clearTimeout(timer); resolve(v); }, e => { window.clearTimeout(timer); reject(e); });
  });
}

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("NG");
  const [countries, setCountries] = useState<Country[]>([]);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadCountries().then(setCountries).catch(() => setCountries([]));
    const params = new URLSearchParams(window.location.search);
    if (params.get("verify") === "1") setMode("verify");
    if (params.get("reset") === "1") setMode("reset");
    const savedEmail = sessionStorage.getItem(OTP_EMAIL_KEY);
    const savedKind = sessionStorage.getItem(OTP_KIND_KEY);
    if (savedEmail && savedKind) setEmail(savedEmail);
  }, []);

  const clearPending = () => {
    sessionStorage.removeItem(OTP_KIND_KEY);
    sessionStorage.removeItem(OTP_EMAIL_KEY);
    sessionStorage.removeItem(LOGIN_PASSWORD_KEY);
  };

  const switchMode = (next: Mode) => {
    clearPending();
    setCode("");
    setShowPassword(false);
    setMode(next);
  };

  async function sendLoginCode(target: string) {
    const { error } = await withTimeout(supabase.auth.signInWithOtp({ email: target, options: { shouldCreateUser: false } }));
    if (error) throw error;
    sessionStorage.setItem(OTP_KIND_KEY, "login");
    sessionStorage.setItem(OTP_EMAIL_KEY, target);
  }

  async function sendSignupCode(target: string) {
    const { error } = await withTimeout(supabase.auth.resend({ type: "signup", email: target }));
    if (error) throw error;
    sessionStorage.setItem(OTP_KIND_KEY, "signup");
    sessionStorage.setItem(OTP_EMAIL_KEY, target);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    const clean = email.trim().toLowerCase();
    try {
      if (!clean) throw new Error("Enter your email address.");

      if (mode === "signup") {
        const selected = countries.find(c => c.code === country);
        if (!fullName.trim() || !phone.trim() || !selected) throw new Error("Please complete your full name, country and phone number.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        const { data, error } = await withTimeout(supabase.auth.signUp({
          email: clean,
          password,
          options: { data: { display_name: fullName.trim(), full_name: fullName.trim(), phone: phone.trim(), country: selected.name, country_iso: selected.code } }
        }));
        if (error) {
          if (/already registered|already exists/i.test(error.message)) throw new Error("This email is already registered. Please sign in instead.");
          throw error;
        }
        if (!data.user) throw new Error("Account creation failed. Please try again.");
        await supabase.auth.signOut();
        sessionStorage.setItem(OTP_KIND_KEY, "signup");
        sessionStorage.setItem(OTP_EMAIL_KEY, clean);
        setEmail(clean);
        setCode("");
        setMode("verify");
        toast.success("Account created. Check your email for the 6-digit verification code.");
        return;
      }

      if (mode === "login") {
        if (password.length < 6) throw new Error("Enter your password.");
        const { data, error } = await withTimeout(supabase.auth.signInWithPassword({ email: clean, password }));
        if (error) {
          if (/email\s*not\s*confirmed|confirm.*email/i.test(error.message)) {
            sessionStorage.setItem(OTP_KIND_KEY, "signup");
            sessionStorage.setItem(OTP_EMAIL_KEY, clean);
            setMode("verify");
            await sendSignupCode(clean);
            toast.info("Your email is not verified. A new verification code was sent.");
            return;
          }
          throw error;
        }
        if (!data.user || !data.session) throw new Error("Login could not be completed. Please check your email and password.");
        await supabase.auth.signOut();
        sessionStorage.setItem(LOGIN_PASSWORD_KEY, password);
        setEmail(clean);
        setCode("");
        await sendLoginCode(clean);
        setMode("verify");
        toast.success("A login verification code was sent to your email.");
        return;
      }

      if (mode === "verify") {
        if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit verification code.");
        const kind = sessionStorage.getItem(OTP_KIND_KEY) === "signup" ? "signup" : "login";
        if (kind === "signup") {
          const { data, error } = await withTimeout(supabase.auth.verifyOtp({ email: clean, token: code, type: "signup" }));
          if (error) throw error;
          if (!data.user || !data.session) throw new Error("Email verification could not be completed. Please use the latest code.");
        } else {
          const pendingPassword = sessionStorage.getItem(LOGIN_PASSWORD_KEY);
          if (!pendingPassword) throw new Error("Your login verification session expired. Please sign in again.");
          const { data, error } = await withTimeout(supabase.auth.verifyOtp({ email: clean, token: code, type: "email" }));
          if (error) throw error;
          if (!data.session || !data.user) throw new Error("The login code could not be verified. Please use the latest code.");
        }
        clearPending();
        toast.success("Verification successful");
        await navigate({ to: "/", replace: true });
        return;
      }

      if (new URLSearchParams(window.location.search).get("reset") === "1") {
        if (newPassword.length < 6) throw new Error("New password must be at least 6 characters.");
        if (newPassword !== confirmPassword) throw new Error("The passwords do not match.");
        const { error } = await withTimeout(supabase.auth.updateUser({ password: newPassword }));
        if (error) throw error;
        await supabase.auth.signOut();
        window.history.replaceState({}, "", "/auth");
        setNewPassword(""); setConfirmPassword(""); setMode("login");
        toast.success("Your password has been reset. You can now sign in.");
        return;
      }

      const { error } = await withTimeout(supabase.auth.resetPasswordForEmail(clean, { redirectTo: `${window.location.origin}/auth?reset=1` }));
      if (error) throw error;
      toast.success("Password reset instructions were sent to your email.");
      setMode("login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (!email.trim() || loading) return;
    setLoading(true);
    try {
      const target = email.trim().toLowerCase();
      const kind = sessionStorage.getItem(OTP_KIND_KEY) === "signup" ? "signup" : "login";
      if (kind === "signup") await sendSignupCode(target); else await sendLoginCode(target);
      toast.success("A new 6-digit code has been sent to your email.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to resend the code. Please try again.");
    } finally { setLoading(false); }
  }

  const resetRequest = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("reset") === "1";
  const title = mode === "login" ? "Welcome back" : mode === "signup" ? "Welcome to SmartChain" : mode === "verify" ? "Verify your email" : "Reset your password";

  return <main className="mx-auto grid min-h-screen max-w-lg place-items-center px-4 py-8"><section className="w-full rounded-3xl border border-border bg-card p-6 shadow-lg"><div className="mb-7 text-center"><img src="/smartchain-logo.svg" alt="SmartChain" className="mx-auto size-12 rounded-2xl"/><h1 className="mt-4 text-2xl font-semibold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{mode === "signup" ? "Create your wallet" : mode === "verify" ? "Enter the code sent to your email" : resetRequest ? "Choose a new password" : "Securely access your wallet dashboard and portfolio"}</p></div>
  {mode === "verify" ? <form onSubmit={e => void submit(e)} className="space-y-4"><p className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">A 6-digit code was sent to <b className="text-foreground">{email}</b>. You must enter the code before continuing.</p><label className="block text-sm font-medium">Verification code<input required minLength={6} maxLength={6} inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-1.5 w-full rounded-xl border bg-background px-3 py-3 text-center text-xl tracking-[0.4em]" placeholder="000000"/></label><button type="submit" disabled={loading || code.length !== 6} className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60">{loading ? "Verifying…" : "Verify and continue"}</button><button type="button" disabled={loading} onClick={() => void resendCode()} className="w-full rounded-xl border px-4 py-3 text-sm font-semibold">Resend code</button><button type="button" onClick={() => switchMode("login")} className="w-full text-sm text-muted-foreground">Back to sign in</button></form> : mode === "reset" && resetRequest ? <form onSubmit={e => void submit(e)} className="space-y-4"><label className="block text-sm font-medium">New password<input required minLength={6} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border bg-background px-3 py-3" placeholder="At least 6 characters"/></label><label className="block text-sm font-medium">Confirm new password<input required minLength={6} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border bg-background px-3 py-3" placeholder="Repeat your password"/></label><button type="submit" disabled={loading} className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60">{loading ? "Saving…" : "Set new password"}</button></form> : <><div className="mb-6 grid grid-cols-2 rounded-xl bg-secondary p-1"><button type="button" onClick={() => switchMode("login")} className={`rounded-lg px-3 py-2 text-sm font-medium ${mode === "login" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Sign in</button><button type="button" onClick={() => switchMode("signup")} className={`rounded-lg px-3 py-2 text-sm font-medium ${mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Create account</button></div><form onSubmit={e => void submit(e)} className="space-y-4">{mode === "signup" && <><label className="block text-sm font-medium">Full name<input required value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1.5 w-full rounded-xl border bg-background px-3 py-3" placeholder="Your full name"/></label><label className="block text-sm font-medium">Country<select required value={country} onChange={e => setCountry(e.target.value)} className="mt-1.5 w-full rounded-xl border bg-background px-3 py-3">{countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></label><label className="block text-sm font-medium">Phone number<input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1.5 w-full rounded-xl border bg-background px-3 py-3" placeholder="Phone number"/></label></>}<label className="block text-sm font-medium">Email<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border bg-background px-3 py-3" placeholder="you@example.com"/></label>{mode === "login" || mode === "signup" ? <label className="block text-sm font-medium">Password<span className="relative mt-1.5 block"><input required minLength={6} type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-3 pr-11" placeholder="At least 6 characters"/><button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span></label> : <p className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">Enter your account email and we will send password reset instructions.</p>}<button type="submit" disabled={loading} className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60">{loading ? "Please wait…" : mode === "login" ? "Continue to verification" : mode === "signup" ? "Create account" : "Send reset email"}</button></form>{mode === "login" && <button type="button" onClick={() => switchMode("reset")} className="mt-4 w-full text-sm text-muted-foreground">Forgot password?</button>}</>}</section></main>;
}
