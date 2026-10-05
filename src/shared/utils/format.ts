/**
 * Formats d'affichage uniques de l'application (fr-FR). Aucune valeur métier n'est
 * recalculée ici : ces fonctions ne font que présenter.
 */
const ZERO_DECIMAL = new Set(["XAF", "XOF", "JPY", "KRW"]);

export function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: ZERO_DECIMAL.has(currency) ? 0 : 2,
  }).format(value);
}

export function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits }).format(
    value,
  );
}

export function formatPercent(ratio: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    maximumFractionDigits,
  }).format(ratio);
}

function toDate(value: string | number | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | number | Date | null | undefined) {
  const date = value == null ? null : toDate(value);
  return date
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date)
    : "—";
}

export function formatDateTime(
  value: string | number | Date | null | undefined,
) {
  const date = value == null ? null : toDate(value);
  return date
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date)
    : "—";
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

/** « il y a 3 min », « dans 2 jours », « à l'instant ». */
export function formatRelative(
  value: string | number | Date | null | undefined,
  now = Date.now(),
) {
  const date = value == null ? null : toDate(value);
  if (!date) return "—";
  const seconds = Math.round((date.getTime() - now) / 1000);
  if (Math.abs(seconds) < 45) return "à l’instant";
  const format = new Intl.RelativeTimeFormat("fr-FR", {
    numeric: "auto",
    style: "short",
  });
  for (const [unit, size] of UNITS)
    if (Math.abs(seconds) >= size)
      return format.format(Math.round(seconds / size), unit);
  return format.format(Math.round(seconds / 60), "minute");
}

const BYTE_UNITS = ["o", "Ko", "Mo", "Go", "To"] as const;

/** Unités décimales (1 Go = 10^9 octets), la convention des forfaits Internet. */
export function formatBytes(bytes: number) {
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < BYTE_UNITS.length - 1) {
    value /= 1000;
    unit += 1;
  }
  return `${formatNumber(value, unit === 0 ? 0 : 2)} ${BYTE_UNITS[unit]}`;
}
