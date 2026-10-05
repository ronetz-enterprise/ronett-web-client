const dateTime = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

const day = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

const count = new Intl.NumberFormat("fr-FR");

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : dateTime.format(parsed);
}

export function formatDay(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : day.format(parsed);
}

export function formatCount(value: number) {
  return count.format(value);
}

/** Une récence est annoncée explicitement : la donnée projetée n'est pas la donnée du jour. */
export function freshness(value: string | null | undefined) {
  if (!value) return "Projection jamais écrite";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Fraîcheur inconnue";
  return `Données projetées au ${day.format(parsed)}`;
}

export function formatMoney(value: number | null, currency: string | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency ?? "XOF",
    maximumFractionDigits: 0,
  }).format(value);
}
