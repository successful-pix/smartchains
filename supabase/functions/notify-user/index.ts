import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  try{
    const auth=req.headers.get("Authorization"); if(!auth)throw new Error("Missing authorization");
    const supabaseUrl=Deno.env.get("SUPABASE_URL")!;const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;const admin=createClient(supabaseUrl,serviceKey);
    const token=auth.replace(/^Bearer\s+/i,"");const {data:{user},error:userError}=await admin.auth.getUser(token);if(userError||!user)throw new Error("Unauthorized");
    const body=await req.json();const type=body?.type;const title=String(body?.title??"").slice(0,140);const message=String(body?.message??"").slice(0,4000);if(!title||!message)throw new Error("Title and message are required");
    // Regular users may only email themselves. Admin-originated notifications may target another user.
    let targetId=user.id;const {data:profile}=await admin.from("profiles").select("role").eq("id",user.id).maybeSingle();if(profile?.role==="admin"&&body?.user_id)targetId=String(body.user_id);
    const {data:target,error:targetError}=await admin.auth.admin.getUserById(targetId);if(targetError||!target.user?.email)throw new Error("Recipient email is unavailable");
    const resendKey=Deno.env.get("RESEND_API_KEY");const from=Deno.env.get("EMAIL_FROM");if(!resendKey||!from)throw new Error("Email provider is not configured");
    const event=type==="deposit"?"Deposit update":type==="support_reply"?"New support reply":"SmartChain notification";
    const html=`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px"><h2>${event}</h2><h3>${title}</h3><p style="white-space:pre-line">${message}</p><p style="color:#6b7280;font-size:12px">This is an automated notification from SmartChain.</p></div>`;
    const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${resendKey}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:[target.user.email],subject:`SmartChain: ${title}`,html})});if(!response.ok)throw new Error(`Email provider error: ${await response.text()}`);
    return new Response(JSON.stringify({ok:true}),{headers:{...corsHeaders,"Content-Type":"application/json"}});
  }catch(error){return new Response(JSON.stringify({error:error instanceof Error?error.message:"Unable to send notification"}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}})}
});
