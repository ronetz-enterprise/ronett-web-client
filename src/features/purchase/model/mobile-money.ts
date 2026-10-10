import { z } from "zod";

/**
 * Paiement mobile money côté client (Cameroun, XAF).
 *
 * Les opérateurs et l'indicatif sont ceux configurés côté serveur pour Flutterwave
 * (`networks` = `MTN`, `ORANGEMONEY` ; `country-code` = `237`) : une autre valeur serait
 * refusée avant tout appel au fournisseur.
 */
export const COUNTRY_CODE = "237";

export const mobileMoneyOperators = [
  {
    network: "MTN",
    name: "MTN Mobile Money",
    // Préfixes les plus répandus, pour présélectionner l'opérateur ; le client peut le changer.
    prefixes: ["67", "650", "651", "652", "653", "654"],
  },
  {
    network: "ORANGEMONEY",
    name: "Orange Money",
    prefixes: ["69", "655", "656", "657", "658", "659"],
  },
] as const;

export type MobileMoneyNetwork =
  (typeof mobileMoneyOperators)[number]["network"];

export function operatorName(network: string) {
  return (
    mobileMoneyOperators.find((operator) => operator.network === network)
      ?.name ?? "Mobile Money"
  );
}

/** Garde les chiffres du numéro local, sans l'indicatif s'il a été saisi. */
export function localDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith(COUNTRY_CODE) && digits.length > 9
    ? digits.slice(COUNTRY_CODE.length)
    : digits;
}

/** « 6 77 11 22 33 » : regroupement lisible pendant la saisie. */
export function formatLocalNumber(value: string) {
  const digits = localDigits(value).slice(0, 9);
  return [
    digits.slice(0, 1),
    digits.slice(1, 3),
    digits.slice(3, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ]
    .filter(Boolean)
    .join(" ");
}

export function isMobileNumber(value: string) {
  return /^6\d{8}$/.test(localDigits(value));
}

/** Format international attendu par le serveur : `+2376XXXXXXXX`. */
export function toInternational(value: string) {
  return `+${COUNTRY_CODE}${localDigits(value)}`;
}

/** « 6 •• •• •• 33 » : rappel du numéro sans l'afficher en entier. */
export function maskNumber(value: string) {
  const digits = localDigits(value);
  if (digits.length < 4) return "";
  return `${digits[0]} •• •• •• ${digits.slice(-2)}`;
}

export function guessNetwork(value: string): MobileMoneyNetwork | null {
  const digits = localDigits(value);
  const match = mobileMoneyOperators.find((operator) =>
    operator.prefixes.some((prefix) => digits.startsWith(prefix)),
  );
  return match?.network ?? null;
}

export const paymentFormSchema = z.object({
  network: z.enum(["MTN", "ORANGEMONEY"], {
    error: "Choisissez votre opérateur.",
  }),
  phone: z
    .string()
    .refine(
      isMobileNumber,
      "Saisissez un numéro mobile à 9 chiffres commençant par 6.",
    ),
  email: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Saisissez une adresse e-mail valide, ou laissez vide.",
    ),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
