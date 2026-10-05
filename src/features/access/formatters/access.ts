import type { AccessPolicy } from "../model/access-grant";

/**
 * Formatage local d'un instant ISO-8601. Le backend reste la source de vérité :
 * aucune date d'expiration n'est recalculée ici, elle est seulement affichée.
 */
export function formatInstant(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Les unités de la politique d'accès sont des entiers 64 bits sérialisés en
 * JSON. Ils sont convertis en `BigInt` uniquement à l'affichage : aucune valeur
 * métier n'est recalculée ni renvoyée.
 */
function exactUnit(
  value: number,
  units: readonly (readonly [bigint, string])[],
) {
  const number = BigInt(value);
  const [scale, label] =
    units.find(([unit]) => number >= unit) ?? units[units.length - 1];
  const remainder = number % scale;
  const fraction = remainder
    ? "," +
      remainder
        .toString()
        .padStart(scale.toString().length - 1, "0")
        .replace(/0+$/, "")
    : "";
  return `${new Intl.NumberFormat("fr-FR").format(number / scale)}${fraction} ${label}`;
}

export function formatValidity(seconds: number) {
  let remaining = BigInt(seconds);
  const parts: string[] = [];
  for (const [unit, label] of [
    [86400n, "j"],
    [3600n, "h"],
    [60n, "min"],
  ] as const) {
    const count = remaining / unit;
    remaining %= unit;
    if (count) parts.push(`${count} ${label}`);
  }
  return parts.join(" ") || "moins d’une minute";
}

export const formatAllowance = (value: number | null) =>
  value === null
    ? "Illimité"
    : exactUnit(value, [
        [1000000000n, "Go"],
        [1000000n, "Mo"],
        [1000n, "ko"],
        [1n, "octets"],
      ]);

export const formatSpeed = (value: number | null) =>
  value === null
    ? "Illimité"
    : exactUnit(value, [
        [1000000000n, "Gbit/s"],
        [1000000n, "Mbit/s"],
        [1000n, "kbit/s"],
        [1n, "bit/s"],
      ]);

export type AccessPolicyLine = { label: string; value: string };

/** Conditions réelles de l'accès, telles que retournées par le backend. */
export function policyLines(policy: AccessPolicy): AccessPolicyLine[] {
  return [
    {
      label: "Durée",
      value: formatValidity(policy.validitySeconds),
    },
    {
      label: "Volume de données",
      value: formatAllowance(policy.dataAllowanceBytes),
    },
    {
      label: "Vitesse de téléchargement",
      value: formatSpeed(policy.downloadLimitBps),
    },
    { label: "Vitesse d’envoi", value: formatSpeed(policy.uploadLimitBps) },
    {
      label: "Appareils connectés en même temps",
      value: new Intl.NumberFormat("fr-FR").format(
        policy.maxConcurrentSessions,
      ),
    },
  ];
}
