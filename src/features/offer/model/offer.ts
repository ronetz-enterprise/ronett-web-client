import { z } from "zod";
import type { Membership } from "@/features/memberships";
import type { Site } from "@/features/site";
export const LONG_MAX = 9223372036854775807n;
export const integerText = (min: bigint, max: bigint) =>
  z
    .string()
    .regex(/^(0|[1-9]\d*)$/, "Saisissez un entier sans séparateur.")
    .refine(
      (v) =>
        /^(0|[1-9]\d*)$/.test(v) &&
        v.length <= 19 &&
        BigInt(v) >= min &&
        BigInt(v) <= max,
      `Valeur attendue entre ${min} et ${max}.`,
    );
const moneyText = z
  .string()
  .regex(
    /^(0|[1-9]\d{0,14})(\.\d{1,4})?$/,
    "Montant positif : 15 chiffres entiers et 4 décimales au maximum, séparateur point.",
  )
  .refine((v) => /[1-9]/.test(v), "Le montant doit être strictement positif.");
export function currencyDigits(currency: string) {
  return (
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  );
}
export const priceSchema = (currency: string) =>
  z.object({
    amount: moneyText.refine(
      (v) =>
        (v.split(".")[1] ?? "").replace(/0+$/, "").length <=
        currencyDigits(currency),
      `Cette devise accepte ${currencyDigits(currency)} décimale(s).`,
    ),
  });
export const detailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Au moins 2 caractères.")
    .max(100, "100 caractères au maximum.")
    .refine(
      (v) =>
        !Array.from(v).some(
          (character) =>
            character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
        ),
      "Caractère de contrôle interdit.",
    ),
  description: z.string().trim().max(500, "500 caractères au maximum."),
});
const optionalLimit = z.union([z.literal(""), integerText(1n, LONG_MAX)]);
export const policySchema = z.object({
  validitySeconds: integerText(1n, 31536000n),
  dataAllowanceBytes: optionalLimit,
  downloadLimitBps: optionalLimit,
  uploadLimitBps: optionalLimit,
  maxConcurrentSessions: integerText(1n, 32n),
});
export const orderSchema = z.object({
  displayOrder: integerText(0n, 2147483647n),
});
export const createSchema = (currency: string) =>
  detailsSchema
    .extend(priceSchema(currency).shape)
    .extend(policySchema.shape)
    .extend(orderSchema.shape);
export type CreateValues = z.infer<ReturnType<typeof createSchema>>;
export type PolicyValues = z.infer<typeof policySchema>;
export type EditKind = "details" | "price" | "policy" | "order";
export type OfferAction = "publish" | "suspend" | "resume" | "archive";
export const policyResponseSchema = z.object({
  validitySeconds: integerText(1n, 31536000n),
  dataAllowanceBytes: integerText(1n, LONG_MAX).nullable(),
  downloadLimitBps: integerText(1n, LONG_MAX).nullable(),
  uploadLimitBps: integerText(1n, LONG_MAX).nullable(),
  maxConcurrentSessions: integerText(1n, 32n),
});
export const offerSchema = z
  .object({
    offerId: z.uuid(),
    organizationId: z.uuid(),
    siteId: z.uuid(),
    name: z.string().min(2).max(100),
    description: z.string().max(500).nullable(),
    price: z.object({
      amount: moneyText,
      currencyCode: z.string().regex(/^[A-Z]{3}$/),
    }),
    accessPolicy: policyResponseSchema,
    status: z.enum(["DRAFT", "PUBLISHED", "SUSPENDED", "ARCHIVED"]),
    displayOrder: integerText(0n, 2147483647n),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .refine(
    (offer) =>
      priceSchema(offer.price.currencyCode).safeParse({
        amount: offer.price.amount,
      }).success,
    "Précision monétaire incohérente.",
  );
export type Offer = z.infer<typeof offerSchema>;
export const offerPageSchema = z.object({
  content: z.array(offerSchema),
  page: integerText(0n, 2147483647n),
  size: integerText(1n, 100n),
  totalElements: integerText(0n, LONG_MAX),
});
export const statusLabels: Record<Offer["status"], string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  SUSPENDED: "Suspendue",
  ARCHIVED: "Archivée",
};
export function offerCapabilities(
  active: Membership,
  site?: Site,
  offer?: Offer,
  currency?: string,
) {
  const owner =
    active.role === "OWNER" &&
    active.membershipStatus === "ACTIVE" &&
    active.organizationStatus === "ACTIVE";
  const scoped =
    owner &&
    !!site &&
    site.organizationId === active.organizationId &&
    (!offer ||
      (offer.organizationId === active.organizationId &&
        offer.siteId === site.id));
  const available = scoped && site?.status === "ACTIVE";
  const editable = available && !!offer && offer.status !== "ARCHIVED";
  const sameCurrency = !!currency && offer?.price.currencyCode === currency;
  return {
    canViewOffers: owner,
    canCreateOffer: available,
    canEditPrice: editable,
    canEditOffer: editable && sameCurrency,
    publish: editable && sameCurrency && offer?.status === "DRAFT",
    suspend: scoped && offer?.status === "PUBLISHED",
    resume: editable && sameCurrency && offer?.status === "SUSPENDED",
    archive: scoped && !!offer && offer.status !== "ARCHIVED",
  };
}
export const offerRoutes = {
  /** Page « Offres » de la barre latérale : choix du site, puis ses offres. */
  home: (org: string, site?: string) =>
    `/app/${org}/offers${site ? `?site=${encodeURIComponent(site)}` : ""}`,
  list: (org: string, site: string) => `/app/${org}/sites/${site}/offers`,
  // Ouvre la modale de création par-dessus la page courante ; `site` garde aussi le filtre.
  create: (_org: string, site?: string) =>
    `?create=offer${site ? `&site=${z.uuid().parse(site)}` : ""}`,
  // Une offre a sa propre adresse, hors du site : le site est un champ de la fiche.
  detail: (org: string, _site: string, id: string) =>
    `/app/${org}/offers/${id}`,
  /** Onglet « Prix et accès » (prix et conditions d'accès, modifiables en place). */
  settings: (org: string, _site: string, id: string) =>
    `/app/${org}/offers/${id}/prix`,
  /** Onglet « Présentation » (nom, description, position sur le portail). */
  presentation: (org: string, id: string) =>
    `/app/${org}/offers/${id}/presentation`,
};
