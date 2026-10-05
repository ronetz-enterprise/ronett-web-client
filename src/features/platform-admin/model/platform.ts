import { z } from "zod";

export const platformPermissions = {
  read: "platform:read",
  organizationRead: "platform:organization:read",
  organizationSuspend: "platform:organization:suspend",
  organizationReactivate: "platform:organization:reactivate",
  networkRead: "platform:network:read",
  auditRead: "platform:audit:read",
  withdrawalApprove: "platform:withdrawal:approve",
  paymentReconcile: "platform:payment:reconcile",
} as const;

export const platformSessionSchema = z.object({
  userId: z.uuid(),
  administrator: z.boolean(),
  permissions: z.array(z.string()),
});
export type PlatformSession = z.infer<typeof platformSessionSchema>;

export const liveTotalsSchema = z.object({
  organizations: z.number().int().min(0),
  activeOrganizations: z.number().int().min(0),
  suspendedOrganizations: z.number().int().min(0),
  closedOrganizations: z.number().int().min(0),
  sites: z.number().int().min(0),
  activeSites: z.number().int().min(0),
  routers: z.number().int().min(0),
  routersOnline: z.number().int().min(0),
  routersOffline: z.number().int().min(0),
  routersUnknownConnectivity: z.number().int().min(0),
});
export type LiveTotals = z.infer<typeof liveTotalsSchema>;

/**
 * Totaux projetés. Une recette n'est comparable que si la projection ne mélange
 * pas les devises : le backend ne renvoie alors ni montant ni devise.
 */
export const projectedTotalsSchema = z.object({
  organizations: z.number().int().min(0),
  activeOrganizations: z.number().int().min(0),
  suspendedOrganizations: z.number().int().min(0),
  sites: z.number().int().min(0),
  activeAccesses: z.number().int().min(0),
  purchases: z.number().int().min(0),
  confirmedPayments: z.number().int().min(0),
  currency: z.string().nullable(),
  grossRevenue: z.number().nullable(),
  mixedCurrencies: z.array(z.string()).nullable(),
  dataLastUpdatedAt: z.iso.datetime({ offset: true }).nullable(),
});
export type ProjectedTotals = z.infer<typeof projectedTotalsSchema>;

export const administrativeActionSchema = z.object({
  id: z.uuid(),
  actionType: z.string(),
  targetType: z.string(),
  targetId: z.uuid(),
  organizationId: z.uuid().nullable(),
  requestedBy: z.uuid(),
  approvedBy: z.uuid().nullable(),
  reason: z.string().nullable(),
  status: z.string(),
  idempotencyKey: z.string(),
  requestedAt: z.iso.datetime({ offset: true }),
  completedAt: z.iso.datetime({ offset: true }).nullable(),
  failureCode: z.string().nullable(),
  failureReason: z.string().nullable(),
  correlationId: z.string().nullable(),
  version: z.number().int().min(0),
});
export type AdministrativeAction = z.infer<typeof administrativeActionSchema>;

export const dashboardSchema = z.object({
  live: liveTotalsSchema,
  projected: projectedTotalsSchema,
  recentActions: z.array(administrativeActionSchema),
  generatedAt: z.iso.datetime({ offset: true }),
});
export type PlatformDashboard = z.infer<typeof dashboardSchema>;

export const organizationStatusSchema = z.enum([
  "ACTIVE",
  "SUSPENDED",
  "CLOSED",
]);
export type OrganizationStatus = z.infer<typeof organizationStatusSchema>;

export const organizationSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  currency: z.string(),
  status: organizationStatusSchema,
  suspensionReason: z.string().nullable(),
  suspendedAt: z.iso.datetime({ offset: true }).nullable(),
  closedAt: z.iso.datetime({ offset: true }).nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
export type PlatformOrganization = z.infer<typeof organizationSummarySchema>;

export const siteSummarySchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  name: z.string(),
  city: z.string(),
  status: organizationStatusSchema,
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
export type PlatformSite = z.infer<typeof siteSummarySchema>;

export const connectivityStatusSchema = z.enum([
  "ONLINE",
  "OFFLINE",
  "UNKNOWN",
]);
export const routerLifecycleStatusSchema = z.enum([
  "ACTIVE",
  "SUSPENDED",
  "CLOSED",
]);
export const routerSummarySchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  siteId: z.uuid().nullable(),
  name: z.string(),
  vendor: z.string().nullable(),
  model: z.string().nullable(),
  lifecycleStatus: routerLifecycleStatusSchema,
  provisioningStatus: z.string(),
  connectivityStatus: connectivityStatusSchema,
  failureCode: z.string().nullable(),
  lastSeenAt: z.iso.datetime({ offset: true }).nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
export type PlatformRouter = z.infer<typeof routerSummarySchema>;

export const auditActorSchema = z.object({
  type: z.string(),
  id: z.uuid().nullable(),
  displayNameSnapshot: z.string().nullable(),
});
export const auditTargetSchema = z.object({
  resourceType: z.string().nullable(),
  resourceId: z.string().nullable(),
  displayNameSnapshot: z.string().nullable(),
});
export const auditEntrySchema = z.object({
  id: z.uuid(),
  eventId: z.uuid(),
  organizationId: z.uuid().nullable(),
  actor: auditActorSchema,
  action: z.string(),
  target: auditTargetSchema,
  result: z.string(),
  severity: z.string(),
  channel: z.string(),
  source: z.string(),
  reason: z.string().nullable(),
  correlationId: z.string().nullable(),
  requestId: z.string().nullable(),
  sessionId: z.uuid().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  occurredAt: z.iso.datetime({ offset: true }),
  recordedAt: z.iso.datetime({ offset: true }),
  metadata: z.record(z.string(), z.string()),
  schemaVersion: z.number().int().min(0),
});
export type AuditEntry = z.infer<typeof auditEntrySchema>;

export const routerDistributionSchema = z.object({
  total: z.number().int().min(0),
  online: z.number().int().min(0),
  offline: z.number().int().min(0),
  unknownConnectivity: z.number().int().min(0),
});

export const organizationDetailSchema = organizationSummarySchema.extend({
  sites: z.array(siteSummarySchema),
  routers: routerDistributionSchema,
  recentAuditEntries: z.array(auditEntrySchema),
});
export type PlatformOrganizationDetail = z.infer<
  typeof organizationDetailSchema
>;

function pageSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    content: z.array(item),
    page: z.number().int().min(0),
    size: z.number().int().min(1),
    totalElements: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  });
}

export const organizationPageSchema = pageSchema(organizationSummarySchema);
export type PlatformOrganizationPage = z.infer<typeof organizationPageSchema>;
export const platformSitePageSchema = pageSchema(siteSummarySchema);
export type PlatformSitePage = z.infer<typeof platformSitePageSchema>;
export const routerPageSchema = pageSchema(routerSummarySchema);
export type PlatformRouterPage = z.infer<typeof routerPageSchema>;
export const auditPageSchema = pageSchema(auditEntrySchema);
export type PlatformAuditPage = z.infer<typeof auditPageSchema>;

export const organizationStatusLabels: Record<OrganizationStatus, string> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspendue",
  CLOSED: "Fermée",
};

export const organizationStatusOptions: OrganizationStatus[] = [
  "ACTIVE",
  "SUSPENDED",
  "CLOSED",
];

export const connectivityLabels = {
  ONLINE: "En ligne",
  OFFLINE: "Hors ligne",
  UNKNOWN: "Inconnue",
} as const;

export const connectivityTones = {
  ONLINE: "success",
  OFFLINE: "danger",
  UNKNOWN: "neutral",
} as const;

export const routerLifecycleLabels: Record<string, string> = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  CLOSED: "Fermé",
};

export const provisioningLabels: Record<string, string> = {
  NOT_REQUESTED: "Non demandée",
  PENDING: "En attente",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  FAILED: "Échouée",
};

export const auditResultLabels: Record<string, string> = {
  SUCCESS: "Succès",
  FAILURE: "Échec",
  DENIED: "Refusé",
};

export const auditResultTones: Record<
  string,
  "success" | "danger" | "warning"
> = {
  SUCCESS: "success",
  FAILURE: "danger",
  DENIED: "warning",
};

export const auditResultOptions = ["SUCCESS", "FAILURE", "DENIED"] as const;

export const auditSeverityLabels: Record<string, string> = {
  INFO: "Information",
  NOTICE: "À noter",
  WARNING: "Avertissement",
  ERROR: "Erreur",
  CRITICAL: "Critique",
};

export const auditSeverityTones: Record<
  string,
  "neutral" | "info" | "warning" | "danger"
> = {
  INFO: "neutral",
  NOTICE: "info",
  WARNING: "warning",
  ERROR: "danger",
  CRITICAL: "danger",
};

export const auditSeverityOptions = [
  "INFO",
  "NOTICE",
  "WARNING",
  "ERROR",
  "CRITICAL",
] as const;

export const auditSourceLabels: Record<string, string> = {
  AUTHENTICATION: "Authentification",
  IDENTITY: "Identité",
  ORGANIZATION: "Organisation",
  MEMBERSHIP: "Membres",
  SITE: "Site",
  ROUTER: "Routeur",
  OFFER: "Offre",
  PURCHASE: "Achat",
  PAYMENT: "Paiement",
  ACCESS: "Accès",
  ACCOUNTING: "Comptabilité",
  SUPPORT: "Assistance",
  PLATFORM: "Plateforme",
  AUDIT: "Audit",
};

export const auditSourceOptions = Object.keys(auditSourceLabels) as [
  AuditSourceOption,
  ...AuditSourceOption[],
];
export type AuditSourceOption = keyof typeof auditSourceLabels;

export const auditActorLabels: Record<string, string> = {
  USER: "Utilisateur",
  SYSTEM: "Système",
  SUPER_ADMIN: "Administrateur plateforme",
};

export const auditActorOptions = ["USER", "SYSTEM", "SUPER_ADMIN"] as const;
export type AuditActorOption = (typeof auditActorOptions)[number];

export const actionStatusLabels: Record<string, string> = {
  REQUESTED: "Demandée",
  EXECUTING: "En cours",
  COMPLETED: "Terminée",
  FAILED: "Échouée",
  REJECTED: "Rejetée",
};

export const actionStatusTones: Record<
  string,
  "neutral" | "info" | "success" | "danger"
> = {
  REQUESTED: "info",
  EXECUTING: "info",
  COMPLETED: "success",
  FAILED: "danger",
  REJECTED: "danger",
};

export const actionTypeLabels: Record<string, string> = {
  ORGANIZATION_SUSPEND: "Suspension d'organisation",
  ORGANIZATION_REACTIVATE: "Réactivation d'organisation",
  ORGANIZATION_CLOSE: "Fermeture d'organisation",
  USER_SUSPEND: "Suspension d'utilisateur",
  ACCESS_REVOKE: "Révocation d'accès",
  ROUTER_REBOOT: "Redémarrage de routeur",
  ROUTER_PROVISION: "Provisionnement de routeur",
  PAYMENT_RECONCILE: "Rapprochement de paiement",
};

/** Le backend exige la confirmation explicite correspondant à l'action. */
export const administrativeConfirmation = {
  suspend: "SUSPEND_ORGANIZATION",
  reactivate: "REACTIVATE_ORGANIZATION",
} as const;

export const organizationActionLabels = {
  suspend: "Suspendre l'organisation",
  reactivate: "Réactiver l'organisation",
} as const;
export type OrganizationAction = keyof typeof organizationActionLabels;

export const organizationActionDescriptions = {
  suspend:
    "La plateforme conserve ses données ; l'organisation perd l'accès à ses services.",
  reactivate: "L'organisation retrouve l'accès à ses services.",
} as const;

/** Motif d'action administrative : il finit dans le journal, il est donc obligatoire. */
export const organizationActionFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Le motif doit comporter au moins 10 caractères.")
    .max(1000, "1 000 caractères maximum."),
});
export type OrganizationActionForm = z.infer<
  typeof organizationActionFormSchema
>;

/** Correspondance d'une valeur à un libellé, sans inventer de traduction manquante. */
export function platformLabel(
  dictionary: Record<string, string>,
  value: string,
) {
  return dictionary[value] ?? `Non documenté (${value})`;
}

export function platformCapabilities(session: PlatformSession | undefined) {
  const granted = session?.permissions ?? [];
  const has = (permission: string) => granted.includes(permission);
  return {
    canViewPlatform: has(platformPermissions.read),
    canReadOrganizations: has(platformPermissions.organizationRead),
    canSuspendOrganization: has(platformPermissions.organizationSuspend),
    canReactivateOrganization: has(platformPermissions.organizationReactivate),
    canReadNetwork: has(platformPermissions.networkRead),
    canReadAudit: has(platformPermissions.auditRead),
    canApproveWithdrawals: has(platformPermissions.withdrawalApprove),
    canReconcilePayments: has(platformPermissions.paymentReconcile),
  };
}
export type PlatformCapabilities = ReturnType<typeof platformCapabilities>;

/** Ce que l'administrateur peut décider sur cette organisation, permissions vérifiées. */
export function organizationActions(
  organization: PlatformOrganization,
  capabilities: PlatformCapabilities,
): OrganizationAction[] {
  if (organization.status === "CLOSED") return [];
  if (organization.status === "ACTIVE")
    return capabilities.canSuspendOrganization ? ["suspend"] : [];
  return capabilities.canReactivateOrganization ? ["reactivate"] : [];
}

export const platformRoutes = {
  dashboard: "/platform-admin",
  organizations: "/platform-admin/organizations",
  organization: (id: string) =>
    `${platformRoutes.organizations}/${z.uuid().parse(id)}`,
  network: "/platform-admin/reseau",
  finance: "/platform-admin/finance",
  audit: "/platform-admin/audit",
};

/** Retrait vu par la plateforme (`WithdrawalView`) : le numéro reste masqué côté serveur. */
export const platformWithdrawalSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  amount: z.number(),
  currency: z.string().length(3),
  network: z.string(),
  country: z.string(),
  maskedMsisdn: z.string(),
  recipientName: z.string(),
  status: z.string(),
  requestedBy: z.uuid().nullable(),
  requestedAt: z.iso.datetime({ offset: true }),
  decidedBy: z.uuid().nullable(),
  decidedAt: z.iso.datetime({ offset: true }).nullable(),
  decisionReason: z.string().nullable(),
  providerTransferId: z.string().nullable(),
  completedAt: z.iso.datetime({ offset: true }).nullable(),
  failureReason: z.string().nullable(),
});
export type PlatformWithdrawal = z.infer<typeof platformWithdrawalSchema>;
export const platformWithdrawalPageSchema = pageSchema(
  platformWithdrawalSchema,
);

export const withdrawalStatusOptions = [
  "PENDING_APPROVAL",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "REJECTED",
  "CANCELLED",
] as const;
export const withdrawalStatusLabels: Record<string, string> = {
  PENDING_APPROVAL: "À approuver",
  PROCESSING: "Versement en cours",
  COMPLETED: "Versé",
  FAILED: "Échoué",
  REJECTED: "Refusé",
  CANCELLED: "Annulé",
  REVERSED: "Annulé par l’opérateur",
};
export const withdrawalStatusTones: Record<
  string,
  "neutral" | "pending" | "info" | "success" | "danger" | "warning"
> = {
  PENDING_APPROVAL: "warning",
  PROCESSING: "info",
  COMPLETED: "success",
  FAILED: "danger",
  REJECTED: "danger",
  CANCELLED: "neutral",
  REVERSED: "danger",
};

/** Le backend exige cette confirmation explicite pour approuver ; le refus n'en demande pas. */
export const withdrawalApprovalConfirmation = "APPROVE_WITHDRAWAL";
export type WithdrawalDecision = "approve" | "reject";

/** Motif d'une décision : mêmes règles que le serveur (10 à 1 000 caractères, sans balise). */
export const decisionReasonSchema = z
  .string()
  .trim()
  .min(10, "Le motif doit comporter au moins 10 caractères.")
  .max(1000, "1 000 caractères maximum.")
  .refine((v) => !/[<>]/.test(v), "Les caractères < et > sont interdits.")
  .refine(
    (v) => !/password|token|secret/i.test(v),
    "N’indiquez aucun secret dans un motif.",
  );

/** `PaymentAnomalyView` : anomalie ouverte détectée sur un paiement. */
export const paymentAnomalySchema = z.object({
  eventId: z.uuid(),
  paymentId: z.uuid().nullable(),
  purchaseId: z.uuid().nullable(),
  code: z.string(),
  occurredAt: z.iso.datetime({ offset: true }),
  correlationId: z.string().nullable(),
  status: z.string(),
  reviewedBy: z.uuid().nullable(),
  reviewedAt: z.iso.datetime({ offset: true }).nullable(),
  resolvedBy: z.uuid().nullable(),
  resolvedAt: z.iso.datetime({ offset: true }).nullable(),
  resolution: z.string().nullable(),
});
export type PaymentAnomaly = z.infer<typeof paymentAnomalySchema>;
export type AnomalyAction = "review" | "resolve";

export const anomalyStatusLabels: Record<string, string> = {
  OPEN: "Ouverte",
  REVIEWED: "En examen",
  RESOLVED: "Résolue",
};

/** `GlobalSearchResultView` : correspondance exacte (identifiant ou email). */
export const searchResultSchema = z.object({
  resourceType: z.string(),
  resourceId: z.uuid(),
  displayReference: z.string(),
  status: z.string().nullable(),
  organizationId: z.uuid().nullable(),
  updatedAt: z.iso.datetime({ offset: true }).nullable(),
});
export type SearchResult = z.infer<typeof searchResultSchema>;

export const searchResourceLabels: Record<string, string> = {
  ORGANIZATION: "Organisation",
  IDENTITY: "Utilisateur",
  ROUTER: "Routeur",
  PAYMENT: "Paiement",
  ACCESS: "Accès",
};

/** La recherche serveur n'accepte qu'un identifiant complet ou un email. */
export function searchableQuery(value: string) {
  const query = value.trim();
  if (z.uuid().safeParse(query).success) return query;
  if (query.length >= 3 && query.includes("@")) return query;
  return null;
}
