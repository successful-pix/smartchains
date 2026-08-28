import { createFileRoute } from "@tanstack/react-router";
import { TransactionForm } from "@/components/wallet/TransactionForm";
export const Route = createFileRoute("/withdraw")({ component: () => <TransactionForm type="withdraw" /> });
