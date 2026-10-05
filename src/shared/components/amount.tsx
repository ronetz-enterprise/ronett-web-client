import { cn } from "@/shared/utils/cn";
import { formatMoney } from "@/shared/utils/format";

/**
 * Montant avec sa devise. `signed` affiche « + » / « − » et colore l'effet sur un solde avec
 * les seuls tons sémantiques (success / danger).
 */
export function Amount({
  value,
  currency,
  signed = false,
  className,
}: {
  value: number;
  currency: string;
  signed?: boolean;
  className?: string;
}) {
  const text = formatMoney(Math.abs(value), currency);
  return (
    <span
      className={cn(
        "tabular-nums",
        signed && value > 0 && "text-success-foreground",
        signed && value < 0 && "text-danger-foreground",
        className,
      )}
    >
      {signed && value !== 0 ? (value > 0 ? "+" : "−") : value < 0 ? "−" : ""}
      {text}
    </span>
  );
}
