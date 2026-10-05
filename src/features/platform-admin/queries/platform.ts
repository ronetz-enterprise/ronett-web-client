import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useNotifiedMutation } from "@/shared/api/use-notified-mutation";
import { useAuth } from "@/features/authentication";
import { ApiError } from "@/shared/errors/api-error";
import {
  auditPageSchema,
  dashboardSchema,
  organizationDetailSchema,
  organizationPageSchema,
  organizationSummarySchema,
  platformSessionSchema,
  platformSitePageSchema,
  routerPageSchema,
  administrativeConfirmation,
  paymentAnomalySchema,
  platformCapabilities,
  platformWithdrawalPageSchema,
  platformWithdrawalSchema,
  searchResultSchema,
  withdrawalApprovalConfirmation,
  type AnomalyAction,
  type WithdrawalDecision,
  type OrganizationAction,
  type PlatformOrganization,
  type PlatformSession,
} from "../model/platform";

type KeyFilters = Readonly<Record<string, string | null>>;

export const platformKeys = {
  all: ["platform"] as const,
  session: ["platform", "session"] as const,
  dashboard: ["platform", "dashboard"] as const,
  organizations: (page: number, size: number, filters: KeyFilters) =>
    ["platform", "organizations", page, size, filters] as const,
  organization: (id: string) => ["platform", "organizations", id] as const,
  sites: (page: number, size: number, filters: KeyFilters) =>
    ["platform", "sites", page, size, filters] as const,
  routers: (page: number, size: number, filters: KeyFilters) =>
    ["platform", "routers", page, size, filters] as const,
  audit: (page: number, size: number, filters: KeyFilters) =>
    ["platform", "audit", page, size, filters] as const,
  mutation: ["platform", "mutation"] as const,
  withdrawals: (status: string, page: number) =>
    ["platform", "withdrawals", status, page] as const,
  anomalies: ["platform", "payment-anomalies"] as const,
  search: (query: string) => ["platform", "search", query] as const,
};

/** Un espace plateforme n'appartient à aucune organisation : pas de préfixe tenant. */
const endpoints = {
  session: "/api/platform/session",
  dashboard: "/api/platform/dashboard",
  organizations: "/api/platform/organizations",
  sites: "/api/platform/sites",
  routers: "/api/platform/routers",
  audit: "/api/platform/audit-entries",
  withdrawals: "/api/platform/withdrawals",
  anomalies: "/api/platform/payment-anomalies",
  search: "/api/platform/search",
} as const;

function queryOf(filters: Record<string, string | null | undefined>) {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters))
    if (value) query[key] = value;
  return query;
}

type PageOf = {
  content: { id: string }[];
  page: number;
  size: number;
};

function readPage<T extends PageOf>(
  schema: z.ZodType<T>,
  value: unknown,
  page: number,
  size: number,
): T {
  const parsed = schema.safeParse(value);
  if (
    !parsed.success ||
    parsed.data.page !== page ||
    parsed.data.size !== size ||
    parsed.data.content.length > size ||
    new Set(parsed.data.content.map((item) => item.id)).size !==
      parsed.data.content.length
  )
    throw new ApiError("invalid-response");
  return parsed.data;
}

/**
 * Permissions effectivement accordées. Le garde de route s'appuie dessus pour
 * interdire l'accès, chaque écran revérifiant ensuite sa propre permission.
 */
export function usePlatformSession() {
  const { request } = useAuth();
  return useQuery({
    queryKey: platformKeys.session,
    staleTime: 60_000,
    retry: false,
    queryFn: async ({ signal }): Promise<PlatformSession> => {
      const result = platformSessionSchema.safeParse(
        await request(endpoints.session, { signal }),
      );
      if (!result.success || !result.data.administrator)
        throw new ApiError("invalid-response");
      return result.data;
    },
  });
}

export function usePlatformDashboard(enabled = true) {
  const { request } = useAuth();
  return useQuery({
    queryKey: platformKeys.dashboard,
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      const result = dashboardSchema.safeParse(
        await request(endpoints.dashboard, { signal }),
      );
      if (!result.success) throw new ApiError("invalid-response");
      return result.data;
    },
  });
}

export type OrganizationListFilters = {
  status: string;
  query: string;
  sort: string;
};

export function usePlatformOrganizations(
  session: PlatformSession | undefined,
  filters: OrganizationListFilters,
  page: number,
  size: number,
) {
  const { request } = useAuth();
  return useQuery({
    queryKey: platformKeys.organizations(page, size, filters),
    enabled: platformCapabilities(session).canReadOrganizations,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      const value = await request(endpoints.organizations, {
        signal,
        // La pagination passe par `query` : le client authentifié refuse un
        // chemin contenant « ? ».
        query: queryOf({
          status: filters.status === "ALL" ? null : filters.status,
          query: filters.query.trim(),
          sort: filters.sort,
          page: String(page),
          size: String(size),
        }),
      });
      return readPage(organizationPageSchema, value, page, size);
    },
  });
}

export function usePlatformOrganization(
  session: PlatformSession | undefined,
  organizationId: string,
) {
  const { request } = useAuth();
  const uuid = z.uuid().safeParse(organizationId).success;
  return useQuery({
    queryKey: platformKeys.organization(organizationId),
    enabled: uuid && platformCapabilities(session).canReadOrganizations,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      const result = organizationDetailSchema.safeParse(
        await request(`${endpoints.organizations}/${organizationId}`, {
          signal,
        }),
      );
      if (!result.success || result.data.id !== organizationId)
        throw new ApiError("invalid-response");
      return result.data;
    },
  });
}

export type NetworkFilters = {
  organizationId: string | null;
  siteId: string | null;
  lifecycleStatus: string;
  connectivityStatus: string;
  query: string;
  sort: string;
};

export function usePlatformSites(
  session: PlatformSession | undefined,
  filters: {
    organizationId: string | null;
    status: string;
    query: string;
    sort: string;
  },
  page: number,
  size: number,
) {
  const { request } = useAuth();
  const query = {
    organizationId: filters.organizationId,
    status: filters.status,
    query: filters.query,
    sort: filters.sort,
  };
  return useQuery({
    queryKey: platformKeys.sites(page, size, query),
    enabled: platformCapabilities(session).canReadNetwork,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      const value = await request(endpoints.sites, {
        signal,
        query: queryOf({
          organizationId: filters.organizationId,
          status: filters.status === "ALL" ? null : filters.status,
          query: filters.query.trim(),
          sort: filters.sort,
          page: String(page),
          size: String(size),
        }),
      });
      return readPage(platformSitePageSchema, value, page, size);
    },
  });
}

export function usePlatformRouters(
  session: PlatformSession | undefined,
  filters: NetworkFilters,
  page: number,
  size: number,
) {
  const { request } = useAuth();
  const query = {
    organizationId: filters.organizationId,
    siteId: filters.siteId,
    lifecycleStatus: filters.lifecycleStatus,
    connectivityStatus: filters.connectivityStatus,
    query: filters.query,
    sort: filters.sort,
  };
  return useQuery({
    queryKey: platformKeys.routers(page, size, query),
    enabled: platformCapabilities(session).canReadNetwork,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      const value = await request(endpoints.routers, {
        signal,
        query: queryOf({
          organizationId: filters.organizationId,
          siteId: filters.siteId,
          lifecycleStatus:
            filters.lifecycleStatus === "ALL" ? null : filters.lifecycleStatus,
          connectivityStatus:
            filters.connectivityStatus === "ALL"
              ? null
              : filters.connectivityStatus,
          query: filters.query.trim(),
          sort: filters.sort,
          page: String(page),
          size: String(size),
        }),
      });
      return readPage(routerPageSchema, value, page, size);
    },
  });
}

export type AuditFilters = {
  organizationId: string | null;
  actorType: string;
  result: string;
  severity: string;
  source: string;
  from: string;
  to: string;
};

export function usePlatformAuditEntries(
  session: PlatformSession | undefined,
  filters: AuditFilters,
  page: number,
  size: number,
) {
  const { request } = useAuth();
  const query = { ...filters };
  return useQuery({
    queryKey: platformKeys.audit(page, size, query),
    enabled: platformCapabilities(session).canReadAudit,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      const value = await request(endpoints.audit, {
        signal,
        query: queryOf({
          organizationId: filters.organizationId,
          actorType: filters.actorType === "ALL" ? null : filters.actorType,
          result: filters.result === "ALL" ? null : filters.result,
          severity: filters.severity === "ALL" ? null : filters.severity,
          source: filters.source === "ALL" ? null : filters.source,
          from: filters.from,
          to: filters.to,
          page: String(page),
          size: String(size),
          sort: "occurredAt",
        }),
      });
      return readPage(auditPageSchema, value, page, size);
    },
  });
}

/**
 * Action administrative sur une organisation.
 *
 * Le backend exige une confirmation explicite, un motif et une clé d'idempotence :
 * une nouvelle clé est produite à chaque tentative, un rejeu de clé étant refusé.
 */
export function useOrganizationAction() {
  const { request } = useAuth();
  const client = useQueryClient();
  return useNotifiedMutation({
    mutationKey: platformKeys.mutation,
    success: (organization, { action }) => ({
      title:
        action === "suspend"
          ? "Organisation suspendue"
          : "Organisation réactivée",
      description: organization.name,
    }),
    mutationFn: async ({
      organizationId,
      action,
      reason,
    }: {
      organizationId: string;
      action: OrganizationAction;
      reason: string;
    }): Promise<PlatformOrganization> => {
      const result = organizationSummarySchema.safeParse(
        await request(
          `${endpoints.organizations}/${organizationId}/${action}`,
          {
            method: "POST",
            body: {
              reason,
              confirmation: administrativeConfirmation[action],
              idempotencyKey: crypto.randomUUID(),
            },
          },
        ),
      );
      if (!result.success || result.data.id !== organizationId)
        throw new ApiError("invalid-response");
      return result.data;
    },
    onSuccess: (_result, variables) => {
      void client.invalidateQueries({ queryKey: platformKeys.all });
      void client.invalidateQueries({
        queryKey: platformKeys.organization(variables.organizationId),
      });
    },
  });
}

export const WITHDRAWAL_PAGE_SIZE = 20;

/** File des retraits, filtrée par statut côté serveur (par défaut : à approuver). */
export function usePlatformWithdrawals(
  session: PlatformSession | undefined,
  status: string,
  page: number,
) {
  const { request } = useAuth();
  return useQuery({
    queryKey: platformKeys.withdrawals(status, page),
    enabled: platformCapabilities(session).canViewPlatform,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      const value = await request(endpoints.withdrawals, {
        signal,
        query: {
          status,
          page: String(page),
          size: String(WITHDRAWAL_PAGE_SIZE),
        },
      });
      return readPage(
        platformWithdrawalPageSchema,
        value,
        page,
        WITHDRAWAL_PAGE_SIZE,
      );
    },
  });
}

/** Approbation ou refus d'un retrait : motif obligatoire, nouvelle clé à chaque tentative. */
export function useWithdrawalDecision() {
  const { request } = useAuth();
  const client = useQueryClient();
  return useNotifiedMutation({
    mutationKey: platformKeys.mutation,
    success: (withdrawal, { decision }) => ({
      title: decision === "approve" ? "Retrait approuvé" : "Retrait refusé",
      description: withdrawal.recipientName,
    }),
    mutationFn: async ({
      withdrawalId,
      decision,
      reason,
    }: {
      withdrawalId: string;
      decision: WithdrawalDecision;
      reason: string;
    }) => {
      const result = platformWithdrawalSchema.safeParse(
        await request(
          `${endpoints.withdrawals}/${z.uuid().parse(withdrawalId)}/${decision}`,
          {
            method: "POST",
            body: {
              reason,
              confirmation:
                decision === "approve" ? withdrawalApprovalConfirmation : null,
              idempotencyKey: crypto.randomUUID(),
            },
          },
        ),
      );
      if (!result.success || result.data.id !== withdrawalId)
        throw new ApiError("invalid-response");
      return result.data;
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["platform", "withdrawals"] });
      void client.invalidateQueries({ queryKey: platformKeys.dashboard });
    },
  });
}

export function usePaymentAnomalies(session: PlatformSession | undefined) {
  const { request } = useAuth();
  return useQuery({
    queryKey: platformKeys.anomalies,
    enabled: platformCapabilities(session).canViewPlatform,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      const result = z.array(paymentAnomalySchema).safeParse(
        await request(endpoints.anomalies, {
          signal,
          query: { limit: "50" },
        }),
      );
      if (!result.success) throw new ApiError("invalid-response");
      return result.data;
    },
  });
}

/** Prise en charge (`review`) ou résolution (`resolve`) d'une anomalie de paiement. */
export function useAnomalyAction() {
  const { request } = useAuth();
  const client = useQueryClient();
  return useNotifiedMutation({
    mutationKey: platformKeys.mutation,
    success: (_anomaly, { action }) => ({
      title:
        action === "review" ? "Anomalie prise en charge" : "Anomalie résolue",
    }),
    mutationFn: async ({
      eventId,
      action,
      reason,
    }: {
      eventId: string;
      action: AnomalyAction;
      reason: string;
    }) => {
      const result = paymentAnomalySchema.safeParse(
        await request(
          `${endpoints.anomalies}/${z.uuid().parse(eventId)}/${action}`,
          {
            method: "POST",
            body: {
              reason,
              confirmation: null,
              idempotencyKey: crypto.randomUUID(),
            },
          },
        ),
      );
      if (!result.success) throw new ApiError("invalid-response");
      return result.data;
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: platformKeys.anomalies });
    },
  });
}

/** Recherche exacte : `query` doit déjà être un identifiant ou un email (voir `searchableQuery`). */
export function usePlatformSearch(
  session: PlatformSession | undefined,
  query: string | null,
) {
  const { request } = useAuth();
  return useQuery({
    queryKey: platformKeys.search(query ?? ""),
    enabled: !!query && platformCapabilities(session).canViewPlatform,
    staleTime: 30_000,
    retry: false,
    queryFn: async ({ signal }) => {
      const result = z.array(searchResultSchema).safeParse(
        await request(endpoints.search, {
          signal,
          query: { query: query ?? "", size: "20" },
        }),
      );
      if (!result.success) throw new ApiError("invalid-response");
      return result.data;
    },
  });
}
