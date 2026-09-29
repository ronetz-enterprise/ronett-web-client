import { z } from "zod";
import type { Membership } from "@/features/memberships";
import type { Site } from "@/features/site";

const reference = z
  .string()
  .regex(/^[A-Za-z0-9_-]{1,150}$/)
  .nullable();
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
export type RouterAction =
  "provision" | "artifact" | "suspend" | "resume" | "revoke";
export const actionLabels: Record<RouterAction, string> = {
  provision: "Demander le provisioning",
  artifact: "Renouveler les instructions",
  suspend: "Demander la suspension",
  resume: "Demander la réactivation",
  revoke: "Demander la révocation",
};
export const lifecycleLabels = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  REVOKED: "Révoqué",
};
export const provisioningLabels = {
  NOT_REQUESTED: "Non demandé",
  PROVISIONING: "En cours",
  PENDING_ENROLLMENT: "En attente d’enrôlement",
  REGISTERED: "Enregistré",
  REVOKING: "Révocation en cours",
  FAILED: "Échoué",
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
  return {
    canViewRouters: ready,
    canCreateRouter: owner,
    canEditRouter: target,
    provision:
      target &&
      siteReady &&
      router.lifecycleStatus === "ACTIVE" &&
      ["NOT_REQUESTED", "FAILED"].includes(router.provisioningStatus),
    artifact:
      target &&
      siteReady &&
      router.lifecycleStatus === "ACTIVE" &&
      ["PENDING_ENROLLMENT", "REGISTERED"].includes(router.provisioningStatus),
    suspend:
      target &&
      !moving &&
      (router.lifecycleStatus === "ACTIVE" || router.failureCode !== null),
    resume:
      target && siteReady && !moving && router.lifecycleStatus === "SUSPENDED",
    revoke: target && router.provisioningStatus !== "REVOKING",
  };
}
export const routerRoutes = {
  list: (org: string) => `/app/${z.uuid().parse(org)}/routers`,
  create: (org: string, siteId?: string) =>
    `${routerRoutes.list(org)}/new${siteId ? `?siteId=${z.uuid().parse(siteId)}` : ""}`,
  detail: (org: string, id: string, siteId?: string) =>
    `${routerRoutes.list(org)}/${z.uuid().parse(id)}${siteId ? `?siteId=${z.uuid().parse(siteId)}` : ""}`,
  settings: (org: string, id: string, siteId?: string) =>
    `${routerRoutes.list(org)}/${z.uuid().parse(id)}/settings${siteId ? `?siteId=${z.uuid().parse(siteId)}` : ""}`,
};
export const isTrackingState = (router?: Router) =>
  !!router &&
  router.lifecycleStatus !== "REVOKED" &&
  ["PROVISIONING", "PENDING_ENROLLMENT", "REVOKING"].includes(
    router.provisioningStatus,
  );
