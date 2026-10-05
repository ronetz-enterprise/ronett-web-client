import { z } from "zod";
import type { Membership } from "@/features/memberships";
import type { Site } from "@/features/site";

/** Opaque control-plane reference, also safe as a single URL path segment. */
export const opaqueReference = z.string().regex(/^[A-Za-z0-9_-]{1,150}$/);
const reference = opaqueReference.nullable();
export const routerSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  siteId: z.uuid().nullable(),
  name: z.string(),
  vendor: z.string(),
  model: z.string(),
  lifecycleStatus: z.enum(["ACTIVE", "SUSPENDED", "REVOKED"]),
  provisioningStatus: z.enum([
    "NOT_REQUESTED",
    "PROVISIONING",
    "PENDING_ENROLLMENT",
    "REGISTERED",
    "REVOKING",
    "FAILED",
  ]),
  connectivityStatus: z.enum(["UNKNOWN", "ONLINE", "OFFLINE"]),
  provisioningOperationId: reference,
  configurationArtifactId: reference,
  failureCode: z.string().nullable(),
  // A single technical action awaits control-plane confirmation; any other one answers 409.
  pendingAction: z
    .enum(["PROVISION", "ARTIFACT", "SUSPEND", "RESUME", "REVOKE"])
    .nullable(),
  // failureMessage and unknown fields are deliberately stripped from the cached view.
  lastSeenAt: z.iso.datetime({ offset: true }).nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
export type Router = z.infer<typeof routerSchema>;
export const routerPageSchema = z.object({
  content: z.array(routerSchema),
  page: z.number().int().nonnegative(),
  size: z.number().int().min(1).max(100),
  totalElements: z.number().int().nonnegative(),
});
const publicText = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "Ce champ est obligatoire.")
    .max(max, `${max} caractères maximum.`)
    .refine(
      (value) =>
        !Array.from(value).some((char) => {
          const code = char.charCodeAt(0);
          return code < 32 || (code >= 127 && code <= 159);
        }),
      "Les caractères de contrôle sont interdits.",
    );
export const routerNameSchema = z.object({ name: publicText(150) });
export const routerCreateSchema = routerNameSchema.extend({
  vendor: publicText(100),
  model: publicText(150),
  siteId: z.uuid("Choisissez un site actif de cette organisation."),
});
export type RouterCreateValues = z.infer<typeof routerCreateSchema>;
/** Seul le modèle de script RouterOS est qualifié par le node-agent (vendor « mikrotik »). */
export const supportedVendor = "MikroTik";
export const routerOsMinimum = "7.13";
/** Équipements courants proposés ; tout autre modèle MikroTik sous RouterOS 7 reste accepté. */
export const routerModels = [
  "hAP ax²",
  "hAP ax³",
  "hAP ac²",
  "hAP ac³",
  "hAP lite",
  "hEX (RB750Gr3)",
  "hEX S",
  "cAP ax",
  "wAP ac",
  "RB4011",
] as const;
/** Parcours de mise en service, du formulaire jusqu'au premier signal du routeur. */
export const setupSteps = [
  "Identifier",
  "Préparer",
  "Installer",
  "Connecter",
] as const;
export type SetupStage =
  { step: 1; state: "todo" | "running" | "failed" } | { step: 2 } | { step: 3 };
/** Étape courante d'un routeur actif, ou null une fois connecté (ou hors parcours). */
export function setupStage(router: Router): SetupStage | null {
  if (router.lifecycleStatus !== "ACTIVE") return null;
  switch (router.provisioningStatus) {
    case "NOT_REQUESTED":
      return {
        step: 1,
        state: router.pendingAction === "PROVISION" ? "running" : "todo",
      };
    case "FAILED":
      return {
        step: 1,
        state: router.pendingAction === "PROVISION" ? "running" : "failed",
      };
    case "PROVISIONING":
      return { step: 1, state: "running" };
    case "PENDING_ENROLLMENT":
      return { step: 2 };
    case "REGISTERED":
      // Un routeur déjà vu puis hors ligne relève de la supervision, plus de l'installation.
      return router.connectivityStatus === "ONLINE" || router.lastSeenAt
        ? null
        : { step: 3 };
    default:
      return null;
  }
}
/** Mise en service terminée : routeur enregistré et déjà vu par Ronetz, ou retiré. */
export const setupComplete = (router: Router) =>
  router.lifecycleStatus === "REVOKED" ||
  (router.provisioningStatus === "REGISTERED" &&
    (router.connectivityStatus === "ONLINE" || router.lastSeenAt !== null));
export type RouterAction =
  "provision" | "artifact" | "suspend" | "resume" | "revoke";
export const actionLabels: Record<RouterAction, string> = {
  provision: "Générer le script d’installation",
  artifact: "Générer un nouveau script",
  suspend: "Suspendre le routeur",
  resume: "Réactiver le routeur",
  revoke: "Révoquer le routeur",
};
export const pendingActionLabels: Record<
  NonNullable<Router["pendingAction"]>,
  string
> = {
  PROVISION: "génération du script",
  ARTIFACT: "génération d’un nouveau script",
  SUSPEND: "suspension",
  RESUME: "réactivation",
  REVOKE: "révocation",
};
export const artifactFileName = (router: Router) => `ronetz-${router.id}.rsc`;
export const lifecycleLabels = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  REVOKED: "Révoqué",
};
export const provisioningLabels = {
  NOT_REQUESTED: "À préparer",
  PROVISIONING: "Préparation en cours",
  PENDING_ENROLLMENT: "À installer",
  REGISTERED: "Installé",
  REVOKING: "Révocation en cours",
  FAILED: "Échec",
};
export const connectivityLabels = {
  UNKNOWN: "Inconnue",
  ONLINE: "En ligne",
  OFFLINE: "Hors ligne",
};
export function routerCapabilities(
  active: Membership,
  router?: Router,
  site?: Site | null,
) {
  const ready =
    active.membershipStatus === "ACTIVE" &&
    active.organizationStatus === "ACTIVE";
  const owner = ready && active.role === "OWNER";
  const target =
    owner &&
    router?.organizationId === active.organizationId &&
    router.lifecycleStatus !== "REVOKED";
  const siteReady =
    router?.siteId === null ||
    (!!site &&
      site.id === router?.siteId &&
      site.organizationId === active.organizationId &&
      site.status === "ACTIVE");
  const moving =
    router?.provisioningStatus === "PROVISIONING" ||
    router?.provisioningStatus === "REVOKING";
  // The backend refuses (409) any command while another one awaits confirmation.
  const command = target && router.pendingAction === null;
  const enrolling =
    target &&
    router.lifecycleStatus === "ACTIVE" &&
    ["PENDING_ENROLLMENT", "REGISTERED"].includes(router.provisioningStatus);
  return {
    canViewRouters: ready,
    canCreateRouter: owner,
    canEditRouter: target,
    download: enrolling && router.configurationArtifactId !== null,
    provision:
      command &&
      siteReady &&
      router.lifecycleStatus === "ACTIVE" &&
      ["NOT_REQUESTED", "FAILED"].includes(router.provisioningStatus),
    artifact: command && siteReady && enrolling,
    suspend:
      command &&
      !moving &&
      (router.lifecycleStatus === "ACTIVE" || router.failureCode !== null),
    resume:
      command && siteReady && !moving && router.lifecycleStatus === "SUSPENDED",
    revoke: command && router.provisioningStatus !== "REVOKING",
  };
}
export const routerRoutes = {
  list: (org: string) => `/app/${z.uuid().parse(org)}/routers`,
  // Ouvre la modale de création par-dessus la page courante.
  create: (_org: string, siteId?: string) =>
    `?create=router${siteId ? `&siteId=${z.uuid().parse(siteId)}` : ""}`,
  detail: (org: string, id: string, siteId?: string) =>
    `${routerRoutes.list(org)}/${z.uuid().parse(id)}${siteId ? `?siteId=${z.uuid().parse(siteId)}` : ""}`,
  settings: (org: string, id: string, siteId?: string) =>
    `${routerRoutes.list(org)}/${z.uuid().parse(id)}/settings${siteId ? `?siteId=${z.uuid().parse(siteId)}` : ""}`,
};
export const isTrackingState = (router?: Router) =>
  !!router &&
  (router.pendingAction !== null ||
    (router.lifecycleStatus !== "REVOKED" &&
      ["PROVISIONING", "PENDING_ENROLLMENT", "REVOKING"].includes(
        router.provisioningStatus,
      )));
