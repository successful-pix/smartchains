import { useEffect, useState } from "react";

export function InstallPrompt() {
  const [event, setEvent] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setEvent(e); if (!localStorage.getItem("smartchain-install-dismissed")) setVisible(true); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  if (!visible || !event) return null;
  return <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-lg rounded-2xl border bg-card p-4 shadow-xl"><div className="flex items-center gap-3"><img src="/smartchain-logo.svg" alt="SmartChain" className="size-12 rounded-xl"/><div className="min-w-0 flex-1"><p className="font-semibold">Install SmartChain</p><p className="text-xs text-muted-foreground">Add SmartChain to your home screen for faster access.</p></div><button onClick={()=>{event.prompt();setVisible(false)}} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Install</button></div><button onClick={()=>{localStorage.setItem("smartchain-install-dismissed","1");setVisible(false)}} className="mt-2 w-full text-xs text-muted-foreground">Not now</button></div>;
}
