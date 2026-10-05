import { currencyDigits } from "../model/offer";
/** Intl handles grouping/currency placement; the fraction is attached as text, never rounded. */
export function formatPrice(amount: string, currency: string) {
  const digits = currencyDigits(currency);
  const [whole, fraction = ""] = amount.split(".");
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
    .formatToParts(BigInt(whole))
    .map((part) =>
      part.type === "fraction"
        ? fraction.padEnd(digits, "0").slice(0, digits)
        : part.value,
    )
    .join("");
}
export function formatDuration(value: string) {
  let remaining = BigInt(value);
  const parts: string[] = [];
  for (const [unit, label] of [
    [86400n, "j"],
    [3600n, "h"],
    [60n, "min"],
    [1n, "s"],
  ] as const) {
    const count = remaining / unit;
    remaining %= unit;
    if (count) parts.push(`${count} ${label}`);
  }
  return parts.join(" ") || "0 s";
}
function exactUnit(
  value: string,
  units: readonly (readonly [bigint, string])[],
) {
  const number = BigInt(value);
  const [scale, label] =
    units.find(([scale]) => number >= scale) ?? units[units.length - 1];
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
export const formatQuota = (v: string | null) =>
  v === null
    ? "Illimité"
    : exactUnit(v, [
        [1000000000n, "Go"],
        [1000000n, "Mo"],
        [1000n, "ko"],
        [1n, "octets"],
      ]);
export const formatRate = (v: string | null) =>
  v === null
    ? "Illimité"
    : exactUnit(v, [
        [1000000000n, "Gbit/s"],
        [1000000n, "Mbit/s"],
        [1000n, "kbit/s"],
        [1n, "bit/s"],
      ]);
