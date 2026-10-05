import { z } from "zod";

/**
 * Projection HTTP de `AccessGrantView`.
 *
 * Le backend sérialise ses statuts en `String` et aucun OpenAPI n'existe : les
 * champs d'état restent des chaînes validées comme non vides, et les libellés
 * doivent prévoir un repli. Aucune valeur de cette vue n'est un secret.
 */
const statusText = z.string().min(1);

export const accessPolicySchema = z.object({
  validitySeconds: z.number().int().min(0),
  dataAllowanceBytes: z.number().int().min(0).nullable(),
  downloadLimitBps: z.number().int().min(0).nullable(),
  uploadLimitBps: z.number().int().min(0).nullable(),
  maxConcurrentSessions: z.number().int().min(0),
});
export type AccessPolicy = z.infer<typeof accessPolicySchema>;

export const accessGrantSchema = z.object({
  accessGrantId: z.uuid(),
  organizationId: z.uuid(),
  siteId: z.uuid(),
  subjectType: statusText,
  subjectId: z.uuid().nullable(),
  sourceType: statusText,
  sourceId: z.uuid().nullable(),
  policy: accessPolicySchema,
  activationMode: statusText,
  status: statusText,
  projectionStatus: statusText,
  issuedByIdentityId: z.uuid().nullable(),
  issuedAt: z.iso.datetime({ offset: true }),
  activatedAt: z.iso.datetime({ offset: true }).nullable(),
  expiresAt: z.iso.datetime({ offset: true }).nullable(),
  suspendedAt: z.iso.datetime({ offset: true }).nullable(),
  revokedAt: z.iso.datetime({ offset: true }).nullable(),
  updatedAt: z.iso.datetime({ offset: true }),
  username: z.string().min(1).nullable(),
});
export type AccessGrant = z.infer<typeof accessGrantSchema>;

export const accessGrantPageSchema = z.object({
  content: z.array(accessGrantSchema),
  page: z.number().int().min(0),
  size: z.number().int().min(1),
  totalElements: z.number().int().min(0),
});
export type AccessGrantPage = z.infer<typeof accessGrantPageSchema>;

/**
 * Libellés dans le vocabulaire du gérant de site (pas celui du backend). Toute valeur
 * inconnue est affichée telle quelle par `accessGrantLabel`.
 */
export const accessGrantStatusLabels: Record<string, string> = {
  PENDING_PROVISIONING: "En préparation",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  EXPIRED: "Expiré",
  QUOTA_EXHAUSTED: "Forfait épuisé",
  REVOKED: "Annulé",
  PROVISIONING_FAILED: "Échec de préparation",
};

/** État de l'accès sur le réseau du site (la « projection » du backend). */
export const projectionStatusLabels: Record<string, string> = {
  NOT_REQUESTED: "Pas encore envoyé",
  PENDING: "Activation en cours",
  APPLIED: "Prêt sur le réseau",
  REMOVAL_PENDING: "Retrait en cours",
  REMOVED: "Retiré du réseau",
  FAILED: "Problème d’activation",
};

/** Origine de l'accès. */
export const accessSourceLabels: Record<string, string> = {
  PAID_ORDER: "Achat d’un client",
  VOUCHER: "Ticket",
  MANUAL_GRANT: "Créé par vous",
  ORGANIZATION_USER: "Membre de l’équipe",
  PROMOTIONAL_CAMPAIGN: "Promotion",
};

/** Personne ou appareil qui utilise l'accès. */
export const accessSubjectLabels: Record<string, string> = {
  ANONYMOUS: "Client sans compte",
  IDENTITY: "Utilisateur Ronetz",
  SUBSCRIBER: "Abonné",
  DEVICE: "Appareil",
};

const terminalStatuses = new Set(["EXPIRED", "QUOTA_EXHAUSTED", "REVOKED"]);

export function accessGrantLabel(
  dictionary: Record<string, string>,
  value: string,
) {
  return dictionary[value] ?? value;
}

export type AccessDisplayState = {
  label: string;
  tone: "success" | "warning" | "pending" | "danger" | "neutral";
  /** L'accès permet au client de se connecter en ce moment. */
  usable: boolean;
};

/**
 * État unique montré au gérant : l'état de l'accès et son état sur le réseau sont réunis
 * (un accès « actif » qui n'est pas encore prêt sur le réseau est « en activation »). Les
 * deux restent consultables séparément dans le détail.
 */
export function accessDisplayState(grant: AccessGrant): AccessDisplayState {
  if (isFailedProjection(grant.projectionStatus))
    return { label: "Problème d’activation", tone: "danger", usable: false };
  if (grant.status === "ACTIVE")
    return isAppliedProjection(grant.projectionStatus)
      ? { label: "Actif", tone: "success", usable: true }
      : { label: "Activation en cours", tone: "pending", usable: false };
  if (grant.status === "PENDING_PROVISIONING")
    return { label: "En préparation", tone: "pending", usable: false };
  return {
    label: accessGrantLabel(accessGrantStatusLabels, grant.status),
    tone: accessStatusTones[grant.status] ?? "neutral",
    usable: false,
  };
}

export function isTerminalGrant(grant: AccessGrant) {
  return terminalStatuses.has(grant.status);
}

export function isAppliedProjection(status: string) {
  return status === "APPLIED";
}

export function isFailedProjection(status: string) {
  return status === "FAILED";
}

/**
 * Étape de préparation réelle : chaque étape n'est validée que par un champ
 * réellement retourné par le backend. Aucun pourcentage n'est inventé.
 */
export type PreparationStep = {
  key: string;
  label: string;
  state: "done" | "current" | "blocked" | "todo";
};

export function preparationSteps(grant: AccessGrant): PreparationStep[] {
  const applied = isAppliedProjection(grant.projectionStatus);
  const failed = isFailedProjection(grant.projectionStatus);
  return [
    { key: "grant", label: "Accès créé", state: "done" },
    {
      key: "projection",
      label: "Activé sur le réseau du site",
      state: applied ? "done" : failed ? "blocked" : "current",
    },
    {
      key: "credential",
      label: "Identifiant de connexion prêt",
      state: grant.username ? (applied ? "done" : "todo") : "todo",
    },
  ];
}

/**
 * Part écoulée de la validité, entre activation et expiration réelles. Le backend n'expose pas
 * le volume consommé par un accès : la jauge porte sur le temps, jamais sur un quota estimé.
 */
export function validityUsage(grant: AccessGrant, now = Date.now()) {
  if (!grant.activatedAt || !grant.expiresAt) return null;
  const start = new Date(grant.activatedAt).getTime();
  const total = new Date(grant.expiresAt).getTime() - start;
  if (total <= 0) return null;
  return { elapsed: Math.min(total, Math.max(0, now - start)), total };
}

export const accessStatusTones: Record<
  string,
  "success" | "warning" | "pending" | "danger" | "neutral"
> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  PENDING_PROVISIONING: "pending",
  EXPIRED: "neutral",
  QUOTA_EXHAUSTED: "neutral",
  REVOKED: "danger",
  PROVISIONING_FAILED: "danger",
};

export const accessRoutes = {
  list: (organizationId: string) =>
    `/app/${z.uuid().parse(organizationId)}/access`,
  // Ouvre la modale de création par-dessus la page courante.
  create: () => "?create=access",
  detail: (organizationId: string, accessGrantId: string) =>
    `${accessRoutes.list(organizationId)}/${z.uuid().parse(accessGrantId)}`,
};
