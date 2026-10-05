import { z } from "zod";

/**
 * Création manuelle d'un accès.
 *
 * Champs réellement acceptés par
 * `POST /api/organizations/{organizationId}/sites/{siteId}/access-grants/manual` :
 * `subjectType`, `subjectId`, `policy`, `activationMode`. L'organisation vient
 * du contexte validé, jamais du corps. `Idempotency-Key` (UUID) est un en-tête
 * obligatoire et sert de `sourceId` de la source `MANUAL_GRANT`.
 *
 * Le gérant saisit des unités lisibles (heures, Go, Mbit/s) ; la conversion vers la politique
 * du backend (secondes, octets, bit/s) a lieu au moment de construire le corps. Bornes : durée
 * de 1 s à 365 jours, 1 à 32 appareils, volumes et vitesses strictement positifs, vide =
 * illimité.
 */
export const MANUAL_SUBJECT_TYPES = [
  "ANONYMOUS",
  "IDENTITY",
  "SUBSCRIBER",
  "DEVICE",
] as const;

export const durationUnits = {
  minutes: { label: "minutes", seconds: 60 },
  hours: { label: "heures", seconds: 3600 },
  days: { label: "jours", seconds: 86400 },
} as const;
export const dataUnits = {
  MB: { label: "Mo", bytes: 1_000_000 },
  GB: { label: "Go", bytes: 1_000_000_000 },
} as const;
const MAX_VALIDITY_SECONDS = 31_536_000;
const MBPS = 1_000_000;

const integer = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, "Saisissez un nombre entier.")
    .refine((value) => {
      const parsed = Number(value);
      return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max;
    }, message);

const optionalInteger = (message: string) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d+$/.test(value),
      "Saisissez un nombre entier, ou laissez vide pour illimité.",
    )
    .refine((value) => {
      if (value === "") return true;
      const parsed = Number(value);
      return Number.isSafeInteger(parsed) && parsed > 0;
    }, message);

export const manualAccessSchema = z
  .object({
    siteId: z.uuid("Choisissez un site actif."),
    subjectType: z.enum(MANUAL_SUBJECT_TYPES),
    subjectId: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || z.uuid().safeParse(value).success,
        "Cette référence n’est pas valide.",
      ),
    validityAmount: integer(1, MAX_VALIDITY_SECONDS, "Saisissez une durée."),
    validityUnit: z.enum(["minutes", "hours", "days"]),
    dataAmount: optionalInteger("Le volume doit être supérieur à zéro."),
    dataUnit: z.enum(["MB", "GB"]),
    downloadMbps: optionalInteger("La vitesse doit être supérieure à zéro."),
    uploadMbps: optionalInteger("La vitesse doit être supérieure à zéro."),
    maxConcurrentSessions: integer(1, 32, "Entre 1 et 32 appareils."),
  })
  .refine(
    (values) => values.subjectType === "ANONYMOUS" || values.subjectId !== "",
    {
      message: "Renseignez la référence du compte ou de l’appareil.",
      path: ["subjectId"],
    },
  )
  .refine(
    (values) =>
      Number(values.validityAmount) *
        durationUnits[values.validityUnit].seconds <=
      MAX_VALIDITY_SECONDS,
    { message: "365 jours maximum.", path: ["validityAmount"] },
  );

export type ManualAccessValues = z.infer<typeof manualAccessSchema>;

export const manualAccessDefaults: ManualAccessValues = {
  siteId: "",
  subjectType: "ANONYMOUS",
  subjectId: "",
  validityAmount: "1",
  validityUnit: "days",
  dataAmount: "",
  dataUnit: "GB",
  downloadMbps: "",
  uploadMbps: "",
  maxConcurrentSessions: "1",
};

/** Corps exact envoyé au backend : unités du service (s, octets, bit/s), `null` = illimité. */
export function manualAccessBody(values: ManualAccessValues) {
  const scaled = (value: string, factor: number) =>
    value === "" ? null : Number(value) * factor;
  return {
    subjectType: values.subjectType,
    subjectId: values.subjectId === "" ? null : values.subjectId,
    // `ON_FIRST_USE` est rejeté par le service : seule `IMMEDIATE` est permise.
    activationMode: "IMMEDIATE",
    policy: {
      validitySeconds:
        Number(values.validityAmount) *
        durationUnits[values.validityUnit].seconds,
      dataAllowanceBytes: scaled(
        values.dataAmount,
        dataUnits[values.dataUnit].bytes,
      ),
      downloadLimitBps: scaled(values.downloadMbps, MBPS),
      uploadLimitBps: scaled(values.uploadMbps, MBPS),
      maxConcurrentSessions: Number(values.maxConcurrentSessions),
    },
  };
}

/**
 * Résultat d'émission.
 *
 * `credentialDelivery` n'est renseigné que **à la création** : un rejeu de la
 * même clé d'idempotence renvoie `created=false` et `credentialDelivery=null`,
 * le mot de passe n'étant jamais rejoué. La réponse contient aussi un jeton de
 * récupération qui n'est ni lu, ni affiché, ni conservé.
 */
export const issuedCredentialSchema = z.object({
  credentialId: z.uuid(),
  username: z.string().min(1),
  clearTextPassword: z.string().min(1),
  expiresAt: z.iso.datetime({ offset: true }),
});
export type IssuedCredential = z.infer<typeof issuedCredentialSchema>;

export const accessIssuanceResultSchema = z.object({
  created: z.boolean(),
  credentialDelivery: issuedCredentialSchema.nullable(),
});
export type AccessIssuanceResult = z.infer<typeof accessIssuanceResultSchema>;
