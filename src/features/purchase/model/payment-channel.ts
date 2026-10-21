import { z } from "zod";
import { localDigits } from "./mobile-money";

/**
 * Moyens de paiement proposés par l'application (`GET /api/public/payment-channels`). Le serveur est la
 * seule source : la liste affichée est celle qu'il accepte au paiement.
 *
 * `fallbackPaymentChannels` ne sert que si la liste ne peut pas être chargée (réseau du hotspot
 * instable) ; le serveur refusera de toute façon un canal qu'il ne propose plus.
 */
export const paymentChannelSchema = z.object({
  id: z.string().regex(/^[A-Z0-9_]{3,40}$/),
  methodType: z.string(),
  network: z.string(),
  label: z.string(),
  logoUrl: z
    .string()
    .regex(/^(\/|https:\/\/)/)
    .nullable(),
  country: z.string(),
  dialCode: z.string(),
  currency: z.string(),
  phonePrefixes: z.array(z.string()),
  minAmount: z.union([z.string(), z.number()]).nullable(),
  maxAmount: z.union([z.string(), z.number()]).nullable(),
  status: z.enum(["ACTIVE", "DEGRADED"]),
});
export type PaymentChannel = z.infer<typeof paymentChannelSchema>;
export const paymentChannelListSchema = z.array(paymentChannelSchema);

export const fallbackPaymentChannels: PaymentChannel[] = [
  {
    id: "MOMO_CM_MTN",
    methodType: "MOBILE_MONEY",
    network: "MTN",
    label: "MTN Mobile Money",
    logoUrl: "/payment-logos/mtn-momo.svg",
    country: "CM",
    dialCode: "237",
    currency: "XAF",
    phonePrefixes: ["67", "650", "651", "652", "653", "654"],
    minAmount: null,
    maxAmount: null,
    status: "ACTIVE",
  },
  {
    id: "MOMO_CM_ORANGE",
    methodType: "MOBILE_MONEY",
    network: "ORANGEMONEY",
    label: "Orange Money",
    logoUrl: "/payment-logos/orange-money.svg",
    country: "CM",
    dialCode: "237",
    currency: "XAF",
    phonePrefixes: ["69", "655", "656", "657", "658", "659"],
    minAmount: null,
    maxAmount: null,
    status: "ACTIVE",
  },
];

/**
 * Retrouve un canal par son identifiant, ou par le code opérateur des achats commencés avant
 * l'existence des canaux (`MTN`, `ORANGEMONEY`).
 */
export function findChannel(
  channels: readonly PaymentChannel[],
  value: string | null | undefined,
) {
  if (!value) return undefined;
  return (
    channels.find((channel) => channel.id === value) ??
    channels.find((channel) => channel.network === value)
  );
}

/** Nom affiché d'un canal, même s'il n'est plus proposé. */
export function channelLabel(
  channels: readonly PaymentChannel[],
  value: string | null | undefined,
) {
  return (
    findChannel(channels, value)?.label ??
    findChannel(fallbackPaymentChannels, value)?.label ??
    "Mobile Money"
  );
}

/** Présélection à partir des premiers chiffres du numéro ; `null` si le préfixe est ambigu ou inconnu. */
export function guessChannel(
  channels: readonly PaymentChannel[],
  value: string,
): string | null {
  const digits = localDigits(value);
  const matches = channels.filter((channel) =>
    channel.phonePrefixes.some((prefix) => digits.startsWith(prefix)),
  );
  return matches.length === 1 ? matches[0].id : null;
}
