import { createFileRoute } from "@tanstack/react-router";
import { TransactionForm } from "@/components/wallet/TransactionForm";
export const Route = createFileRoute("/swap")({ component: () => <TransactionForm type="swap" /> });
