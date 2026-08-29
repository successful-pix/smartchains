import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTransactionRequest, getHoldings, getNotifications, getPreferences, getProfile, getTransactions, markAllNotificationsRead, markNotificationRead, type NewTransaction } from "@/services/walletService";
import type { AppNotification, Profile, TransactionType, UserPreferences, WalletHolding, WalletTransaction } from "@/types/wallet";
