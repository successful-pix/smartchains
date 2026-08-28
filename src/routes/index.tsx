import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/wallet/AppHeader";
import { BalanceCard } from "@/components/wallet/BalanceCard";
import { QuickActions } from "@/components/wallet/QuickActions";
import { AssetList } from "@/components/wallet/AssetList";
import { RecentActivity } from "@/components/wallet/RecentActivity";
import { BottomNavigation } from "@/components/wallet/BottomNavigation";
import { InstallPrompt } from "@/components/wallet/InstallPrompt";
import { SmartChainLoader } from "@/components/wallet/SmartChainLoader";
import { useNotifications, usePortfolio, useTransactions } from "@/hooks/useWalletData";
const title = "SmartChain Wallet — Secure Crypto Dashboard";
const description = "SmartChain is a secure crypto wallet and trading platform.";
const site = "https://smartchains.online";
export const Route = createFileRoute("/")({head: () => ({meta: [{title},{name:"description",content:description},{property:"og:title",content:title},{property:"og:description",content:description},{property:"og:image",content:`${site}/og-image.svg`},{property:"og:url",content:site},{name:"twitter:card",content:"summary_large_image"},{name:"twitter:image",content:`${site}/og-image.svg`},{name:"twitter:url",content:site}]}),component:Dashboard});
function Dashboard(){const [splash,setSplash]=useState(true);const p=usePortfolio();const tx=useTransactions(5);const n=useNotifications();const error=p.markets.error;useEffect(()=>{const id=window.setTimeout(()=>setSplash(false),1000);return()=>window.clearTimeout(id)},[]);if(splash)return <SmartChainLoader/>;return <div className="min-h-screen bg-background pb-24"><AppHeader notificationCount={n.unread}/><main className="mx-auto max-w-lg space-y-6 px-4 pt-5"><h1 className="sr-only">SmartChain wallet dashboard</h1><BalanceCard portfolio={p.portfolio} loading={false}/><QuickActions/><AssetList positions={p.positions} loading={false} error={error?(error as Error).message:null} onRetry={()=>{void p.holdings.refetch();void p.markets.refetch();void tx.refetch()}} onSelect={position=>{window.location.href=`/asset/${position.market.id}`}} onViewAll={()=>{window.location.href="/markets"}}/><RecentActivity transactions={tx.data??[]} loading={tx.isLoading}/></main><InstallPrompt/><BottomNavigation active="home"/></div>}
