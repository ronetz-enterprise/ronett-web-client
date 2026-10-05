import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/utils/cn";
import type { Offer } from "../model/offer";
import { formatDuration, formatPrice, formatQuota } from "../formatters/offer";

/**
 * Miniature du portail d'achat : l'offre telle que la voit un client du site. Purement
 * illustrative : le bouton n'est pas actionnable.
 */
export function OfferPortalPreview({
  offer,
  siteName,
}: {
  offer: Offer;
  siteName: string;
}) {
  return (
    <figure className="space-y-2">
      <div
        aria-hidden="true"
        className="w-full max-w-64 rounded-[1.75rem] border-4 border-muted bg-background p-3 shadow-sm"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
        <p className="text-[0.6875rem] text-muted-foreground">WiFi de</p>
        <p className="mb-3 font-heading text-sm font-semibold break-words">
          {siteName}
        </p>
        <div className="space-y-2 rounded-xl border bg-card p-3 ring-2 ring-primary/20">
          <p className="text-xs font-medium break-words">{offer.name}</p>
          <p className="font-heading text-xl font-semibold tabular-nums">
            {formatPrice(offer.price.amount, offer.price.currencyCode)}
          </p>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="h-4 px-1.5 text-[0.625rem]">
              {formatDuration(offer.accessPolicy.validitySeconds)}
            </Badge>
            <Badge variant="secondary" className="h-4 px-1.5 text-[0.625rem]">
              {formatQuota(offer.accessPolicy.dataAllowanceBytes)}
            </Badge>
          </div>
          {offer.description && (
            <p className="line-clamp-3 text-[0.6875rem] text-muted-foreground">
              {offer.description}
            </p>
          )}
          <div
            className={cn(
              "flex h-6 items-center justify-center rounded-md bg-primary text-[0.625rem] font-medium text-primary-foreground",
              offer.status !== "PUBLISHED" && "opacity-50",
            )}
          >
            Acheter
          </div>
        </div>
        {offer.status !== "PUBLISHED" && (
          <p className="mt-2 text-center text-[0.625rem] text-muted-foreground">
            Visible par les clients une fois publiée
          </p>
        )}
      </div>
    </figure>
  );
}
