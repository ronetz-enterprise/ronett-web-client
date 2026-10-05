import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/features/authentication";
import type { Membership } from "@/features/memberships";
import { tenantKeys } from "@/shared/api/query-client";
import { ApiError } from "@/shared/errors/api-error";
import { notificationManager } from "@/shared/components/notifications";
import { useNotifiedMutation } from "@/shared/api/use-notified-mutation";
import { financeEndpoints } from "../api/finance-endpoints";
import {
  balanceSchema,
  formatMoney,
  ledgerPageSchema,
  refundSchema,
  withdrawalPageSchema,
  withdrawalSchema,
} from "../model/finance";

export const financeKeys = {
  all: (organizationId: string) =>
    tenantKeys.resource(organizationId, "finance"),
  balance: (organizationId: string) =>
    tenantKeys.resource(organizationId, "finance", "balance"),
  ledger: (organizationId: string, page: number) =>
    tenantKeys.resource(organizationId, "finance", "ledger", { page }),
  withdrawals: (organizationId: string, page: number) =>
    tenantKeys.resource(organizationId, "finance", "withdrawals", { page }),
};

/** Le backend exige un OWNER actif d'une organisation active (FINANCE_READ / FINANCE_MANAGE). */
export function financePermissions(active: Membership) {
  const owner =
    active.membershipStatus === "ACTIVE" &&
    active.organizationStatus === "ACTIVE" &&
    active.role === "OWNER";
  return { canViewFinance: owner, canManageFinance: owner };
}

export const PAGE_SIZE = 20;

export function useBalance(active: Membership) {
  const { request } = useAuth();
  return useQuery({
    queryKey: financeKeys.balance(active.organizationId),
    enabled: financePermissions(active).canViewFinance,
    staleTime: 15_000,
    queryFn: async ({ signal }) => {
      const result = balanceSchema.safeParse(
        await request(financeEndpoints.balance(active.organizationId), {
          signal,
        }),
      );
      if (
        !result.success ||
        result.data.organizationId !== active.organizationId
      )
        throw new ApiError("invalid-response");
      return result.data;
    },
  });
}

export function useLedger(active: Membership, page: number) {
  const { request } = useAuth();
  return useQuery({
    queryKey: financeKeys.ledger(active.organizationId, page),
    enabled: financePermissions(active).canViewFinance,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const result = ledgerPageSchema.safeParse(
        await request(financeEndpoints.ledger(active.organizationId), {
          signal,
          query: { page: String(page), size: String(PAGE_SIZE) },
        }),
      );
      if (!result.success) throw new ApiError("invalid-response");
      return result.data;
    },
  });
}

export function useWithdrawals(active: Membership, page: number) {
  const { request } = useAuth();
  return useQuery<z.infer<typeof withdrawalPageSchema>>({
    queryKey: financeKeys.withdrawals(active.organizationId, page),
    enabled: financePermissions(active).canViewFinance,
    placeholderData: keepPreviousData,
    // Un retrait en cours change d'état côté prestataire : rafraîchissement borné.
    refetchInterval: (query) =>
      query.state.data?.content.some((w) => w.status === "PROCESSING")
        ? 15_000
        : false,
    refetchIntervalInBackground: false,
    queryFn: async ({ signal }) => {
      const result = withdrawalPageSchema.safeParse(
        await request(financeEndpoints.withdrawals(active.organizationId), {
          signal,
          query: { page: String(page), size: String(PAGE_SIZE) },
        }),
      );
      if (
        !result.success ||
        result.data.content.some(
          (w) => w.organizationId !== active.organizationId,
        )
      )
        throw new ApiError("invalid-response");
      return result.data;
    },
  });
}

export type WithdrawalRequest = {
  amount: number;
  currency: string;
  network: string;
  country: string;
  msisdn: string;
  recipientFirstName: string;
  recipientLastName: string;
  idempotencyKey: string;
};

export function useRequestWithdrawal(active: Membership) {
  const { request } = useAuth();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (body: WithdrawalRequest) => {
      const result = withdrawalSchema.safeParse(
        await request(financeEndpoints.withdrawals(active.organizationId), {
          method: "POST",
          body,
        }),
      );
      if (!result.success) throw new ApiError("invalid-response");
      return result.data;
    },
    onSuccess: async (withdrawal) => {
      notificationManager.add({
        title:
          withdrawal.status === "PENDING_APPROVAL"
            ? "Retrait soumis à approbation"
            : "Retrait en cours de versement",
        description: `${formatMoney(withdrawal.amount, withdrawal.currency)} vers ${withdrawal.maskedMsisdn}`,
      });
      await client.invalidateQueries({
        queryKey: financeKeys.all(active.organizationId),
      });
    },
  });
}

export function useCancelWithdrawal(active: Membership) {
  const { request } = useAuth();
  return useNotifiedMutation({
    success: {
      title: "Retrait annulé",
      description: "Le montant est de nouveau disponible.",
    },
    invalidate: [financeKeys.all(active.organizationId)],
    mutationFn: async (withdrawalId: string) =>
      request(
        financeEndpoints.withdrawalCancellation(
          active.organizationId,
          withdrawalId,
        ),
        {
          method: "POST",
        },
      ),
  });
}

export type RefundRequest = {
  paymentId: string;
  amount: number;
  reason: string;
  idempotencyKey: string;
};

export function useRequestRefund(active: Membership) {
  const { request } = useAuth();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async ({ paymentId, ...body }: RefundRequest) => {
      const result = refundSchema.safeParse(
        await request(
          financeEndpoints.refunds(active.organizationId, paymentId),
          {
            method: "POST",
            body,
          },
        ),
      );
      if (!result.success || result.data.paymentId !== paymentId)
        throw new ApiError("invalid-response");
      return result.data;
    },
    onSuccess: async (refund) => {
      notificationManager.add({
        title: "Remboursement lancé",
        description: `${formatMoney(refund.amount, refund.currency)} · le client est crédité sous 3 à 5 jours.`,
      });
      await client.invalidateQueries({
        queryKey: financeKeys.all(active.organizationId),
      });
    },
  });
}
