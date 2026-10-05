/**
 * Unités : le backend renvoie des octets bruts. La conversion est décimale
 * (1 Go = 10^9 octets), la convention des forfaits Internet.
 */
const UNITS = ["o", "Ko", "Mo", "Go", "To"] as const;

export function formatBytes(bytes: number) {
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < UNITS.length - 1) {
    value /= 1000;
    unit += 1;
  }
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: unit === 0 ? 0 : 2,
  }).format(value)} ${UNITS[unit]}`;
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

/** Taux de succès d'authentification, `null` sans tentative. */
export function successRate(successes: number, failures: number) {
  const total = successes + failures;
  if (!total) return null;
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(successes / total);
}

export function formatDay(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}
