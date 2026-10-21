import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import {
  formatDuration,
  formatPrice,
  formatQuota,
  formatRate,
  type PublicOffer,
} from "@/features/offer";
import { cn } from "@/shared/utils/cn";

/** « 750 FCFA » → ["750", "FCFA"] : le montant en avant, la devise en petit. */
export function splitPrice(amount: string, currency: string) {
  const text = formatPrice(amount, currency);
  const match = /^(.*\d)\s*(\D+)$/u.exec(text);
  return match ? [match[1], match[2].trim()] : [text, ""];
}

/**
 * Offre en « billet » : le nom en surtitre, le volume en grand avec la durée et la vitesse, puis
 * le prix sur un talon détaché par une perforation. Avec `to`, un appui ouvre le paiement ; sans,
 * c'est le récapitulatif de l'offre choisie.
 */
export function OfferTicket({
  offer,
  to,
}: {
  offer: PublicOffer;
  to?: string;
}) {
  const policy = offer.accessPolicy;
  const quota = formatQuota(policy.dataAllowanceBytes);
  const [price, currency] = splitPrice(
    offer.price.amount,
    offer.price.currencyCode,
  );
  const details = [
    formatDuration(policy.validitySeconds),
    policy.downloadLimitBps ? formatRate(policy.downloadLimitBps) : null,
  ].filter(Boolean);
  // Demi-cercles de la couleur de la page : la carte paraît découpée à la perforation.
  const notch =
    "absolute left-0 size-4 -translate-x-1/2 rounded-full border border-border/70 bg-background";
  const label = `${offer.name} : ${quota}, ${details.join(", ")}, ${price} ${currency}`;
  const base =
    "group relative flex h-[4.75rem] items-stretch overflow-hidden rounded-xl border border-border/70 bg-card shadow-[0_1px_1px_0_rgb(0_0_0/0.04)]";
  const content = (
    <>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 pr-4 pl-4">
        <span className="truncate text-[0.6875rem] leading-none font-semibold tracking-[0.08em] text-primary uppercase">
          {offer.name}
        </span>
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="font-heading text-[1.375rem] leading-none font-semibold tracking-tight tabular-nums">
            {quota}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {details.join(" · ")}
          </span>
        </span>
      </span>

      <span
        aria-hidden="true"
        className="relative flex w-[6.75rem] shrink-0 items-center justify-end gap-2 bg-muted/40 pr-3 pl-4"
      >
        <span className={cn(notch, "-top-2")} />
        <span className={cn(notch, "-bottom-2")} />
        <span className="absolute inset-y-3 left-0 border-l border-dashed border-border" />
        <span className="flex flex-col items-end">
          <span className="font-heading text-lg leading-none font-semibold tracking-tight tabular-nums">
            {price}
          </span>
          <span className="mt-1 text-[0.625rem] font-medium tracking-[0.12em] text-muted-foreground uppercase">
            {currency}
          </span>
        </span>
        {to && (
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
          />
        )}
      </span>
    </>
  );
  if (!to)
    return (
      <div role="group" aria-label={label} className={base}>
        {content}
      </div>
    );
  return (
    <Link
      to={to}
      aria-label={label}
      className={cn(
        base,
        "transition-[border-color,box-shadow,transform] duration-200 outline-none hover:border-primary/40 hover:shadow-[0_1px_2px_0_rgb(0_0_0/0.06)] focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.99]",
      )}
    >
      {content}
    </Link>
  );
}
