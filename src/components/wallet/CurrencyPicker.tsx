import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { updatePreferences } from "@/services/walletService";

const CURRENCIES = [["USD","US Dollar"],["EUR","Euro"],["GBP","British Pound"],["NGN","Nigerian Naira"],["CAD","Canadian Dollar"],["AUD","Australian Dollar"],["NZD","New Zealand Dollar"],["CHF","Swiss Franc"],["JPY","Japanese Yen"],["CNY","Chinese Yuan"],["HKD","Hong Kong Dollar"],["SGD","Singapore Dollar"],["INR","Indian Rupee"],["AED","UAE Dirham"],["SAR","Saudi Riyal"],["ZAR","South African Rand"],["KES","Kenyan Shilling"],["GHS","Ghanaian Cedi"],["XOF","West African CFA Franc"],["BRL","Brazilian Real"],["MXN","Mexican Peso"],["ARS","Argentine Peso"],["CLP","Chilean Peso"],["COP","Colombian Peso"],["PEN","Peruvian Sol"],["TRY","Turkish Lira"],["SEK","Swedish Krona"],["NOK","Norwegian Krone"],["DKK","Danish Krone"],["PLN","Polish Zloty"],["CZK","Czech Koruna"],["HUF","Hungarian Forint"],["RON","Romanian Leu"],["BGN","Bulgarian Lev"],["ISK","Icelandic Krona"],["RUB","Russian Ruble"],["UAH","Ukrainian Hryvnia"],["THB","Thai Baht"],["MYR","Malaysian Ringgit"],["IDR","Indonesian Rupiah"],["PHP","Philippine Peso"],["VND","Vietnamese Dong"],["KRW","South Korean Won"],["TWD","New Taiwan Dollar"],["PKR","Pakistani Rupee"],["BDT","Bangladeshi Taka"],["EGP","Egyptian Pound"],["MAD","Moroccan Dirham"],["DZD","Algerian Dinar"],["QAR","Qatari Riyal"],["KWD","Kuwaiti Dinar"],["BHD","Bahraini Dinar"],["OMR","Omani Rial"],["JOD","Jordanian Dinar"],["ILS","Israeli New Shekel"]] as const;

export function CurrencyPicker({ value, onChange }: { value: string; onChange: (currency: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const filtered = useMemo(() => CURRENCIES.filter(([code, name]) => `${code} ${name}`.toLowerCase().includes(search.toLowerCase())), [search]);
  useEffect(() => { if (!open) setSearch(""); }, [open]);

  async function choose(code: string) {
    if (code === value) { setOpen(false); return; }
    // Apply immediately so the balance card changes even if the database
    // request is slow. BalanceCard also stores this choice locally.
    onChange(code);
    setSaving(true);
    try {
      await updatePreferences({ currency: code });
      await qc.invalidateQueries({ queryKey: ["preferences"] });
      setOpen(false);
    } catch {
      // The UI choice remains applied locally; the next authenticated save
      // can persist it once the preferences service is available.
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return <><button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary">{value}<span className="text-muted-foreground">▾</span></button>{open&&<div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 sm:items-center sm:p-4"><div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl sm:rounded-3xl"><div className="flex items-center justify-between border-b border-border p-4"><div><h2 className="font-semibold">Display currency</h2><p className="text-xs text-muted-foreground">Choose the currency for your wallet balance.</p></div><button type="button" onClick={()=>setOpen(false)} className="rounded-full p-2 hover:bg-secondary"><X size={18}/></button></div><div className="p-3"><div className="flex items-center gap-2 rounded-xl border border-input bg-secondary/40 px-3"><Search size={17} className="text-muted-foreground"/><input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search currency or code" className="h-11 w-full bg-transparent text-sm outline-none"/></div></div><div className="max-h-[58vh] overflow-y-auto px-2 pb-3">{filtered.map(([code,name])=><button disabled={saving} key={code} type="button" onClick={()=>void choose(code)} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-secondary disabled:opacity-50"><span><span className="font-semibold">{code}</span><span className="ml-3 text-sm text-muted-foreground">{name}</span></span>{code===value&&<Check size={18} className="text-primary"/>}</button>)}</div></div></div>}</>;
}
