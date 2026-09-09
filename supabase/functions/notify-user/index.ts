import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error("Missing authorization");

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = auth.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: userError } = await admin.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const type = String(body?.type ?? "notification");
    const title = String(body?.title ?? "").slice(0, 160);
    const message = String(body?.message ?? "").slice(0, 5000);
    const actionUrl = String(body?.action_url ?? Deno.env.get("APP_URL") ?? "").trim();
    const actionLabel = String(body?.action_label ?? "Open SmartChain").slice(0, 40);
    if (!title || !message) throw new Error("Title and message are required");

    let targetId = user.id;
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role === "admin" && body?.user_id) targetId = String(body.user_id);

    const { data: target, error: targetError } = await admin.auth.admin.getUserById(targetId);
    if (targetError || !target.user?.email) throw new Error("Recipient email is unavailable");

    // Support both the existing Supabase secret name and the recommended uppercase name.
    const resendKey = Deno.env.get("RESEND_API_KEY") || Deno.env.get("Resend_API_KEY");
    const from = Deno.env.get("EMAIL_FROM");
    if (!resendKey || !from) throw new Error("Email provider is not configured. Set Resend_API_KEY/RESEND_API_KEY and EMAIL_FROM.");

    const event = type === "deposit" || type === "credit" ? "Deposit confirmation" : type === "support_reply" ? "New support reply" : type === "kyc_approved" ? "KYC verification approved" : "SmartChain notification";
    const safeEvent = escapeHtml(event);
    const safeTitle = escapeHtml(title);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
    const safeActionUrl = escapeHtml(actionUrl);
    const safeActionLabel = escapeHtml(actionLabel);
    const button = actionUrl ? `<div style="margin:28px 0"><a href="${safeActionUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:10px;font-weight:700">${safeActionLabel}</a></div>` : "";

    const html = `<!doctype html><html><body style="margin:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827"><div style="max-width:620px;margin:0 auto;padding:32px 16px"><div style="background:#111827;color:#fff;padding:18px 24px;border-radius:16px 16px 0 0;font-size:20px;font-weight:800">SmartChain</div><div style="background:#ffffff;padding:30px 24px;border-radius:0 0 16px 16px;border:1px solid #e5e7eb"><div style="font-size:13px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:.06em">${safeEvent}</div><h1 style="font-size:23px;line-height:1.3;margin:10px 0 18px">${safeTitle}</h1><div style="font-size:15px;line-height:1.7;color:#374151">${safeMessage}</div>${button}<hr style="border:0;border-top:1px solid #e5e7eb;margin:28px 0 18px"><p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6">This is an automated notification from SmartChain. If you did not expect this message, please contact SmartChain Support.</p></div></div></body></html>`;
    const subject = type === "credit" ? "Deposit Confirmed — Your SmartChain Wallet Has Been Credited" : type === "support_reply" ? "New Support Reply from SmartChain" : type === "kyc_approved" ? "KYC Approved — Your SmartChain Account Is Verified" : `SmartChain: ${title}`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [target.user.email], subject, html }),
    });
    const responseText = await response.text();
    if (!response.ok) throw new Error(`Email provider error: ${responseText}`);

    return new Response(JSON.stringify({ ok: true, email: target.user.email, provider: "resend" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Unable to send notification" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
