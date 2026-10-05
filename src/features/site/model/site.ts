import { z } from "zod";
import type { Membership } from "@/features/memberships";

export const siteStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]);
export const siteSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  city: z.string(),
  district: z.string().nullable(),
  addressDetails: z.string().nullable(),
  timezone: z.string(),
  status: siteStatusSchema,
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
export type Site = z.infer<typeof siteSchema>;
export type SiteAction = "suspend" | "reactivate" | "close";
export const siteStatusLabels = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  CLOSED: "Fermé",
};
export const siteActionLabels = {
  suspend: "Suspendre",
  reactivate: "Réactiver",
  close: "Fermer définitivement",
};
export const siteFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Le nom est obligatoire.")
    .max(150, "150 caractères maximum."),
  city: z
    .string()
    .trim()
    .min(1, "La ville est obligatoire.")
    .max(150, "150 caractères maximum."),
  description: z.string().trim().max(2000, "2 000 caractères maximum."),
  district: z.string().trim().max(150, "150 caractères maximum."),
  addressDetails: z.string().trim().max(500, "500 caractères maximum."),
  // Java's zone database is authoritative; browser Intl aliases differ from Java.
  timezone: z
    .string()
    .trim()
    .min(1, "Le fuseau horaire est obligatoire.")
    .max(100, "100 caractères maximum."),
});
export type SiteFormValues = z.infer<typeof siteFormSchema>;
export type UpdateSiteRequest = Partial<SiteFormValues>;
export function siteCapabilities(active: Membership, site?: Site) {
  const readable =
    active.membershipStatus === "ACTIVE" &&
    active.organizationStatus === "ACTIVE";
  const owner = readable && active.role === "OWNER";
  const target = owner && site?.organizationId === active.organizationId;
  return {
    canViewSites: readable,
    canCreateSite: owner,
    canEditSite: target && site.status !== "CLOSED",
    suspend: target && site.status === "ACTIVE",
    reactivate: target && site.status === "SUSPENDED",
    close: target && site.status !== "CLOSED",
  };
}
export const siteRoutes = {
  list: (org: string) => `/app/${z.uuid().parse(org)}/sites`,
  // Ouvre la modale de création par-dessus la page courante.
  create: () => "?create=site",
  detail: (org: string, id: string) =>
    `${siteRoutes.list(org)}/${z.uuid().parse(id)}`,
  settings: (org: string, id: string) =>
    `${siteRoutes.detail(org, id)}/settings`,
  routers: (org: string, id: string) => `${siteRoutes.detail(org, id)}/routers`,
  offers: (org: string, id: string) => `${siteRoutes.detail(org, id)}/offers`,
  /** Portail public d'achat du site, partagé aux clients (lien et QR code). */
  portal: (id: string) => `/connect/${z.uuid().parse(id)}`,
};
