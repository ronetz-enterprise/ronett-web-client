import { HugeiconsIcon } from "@hugeicons/react";
import { Wifi01Icon } from "@hugeicons/core-free-icons";
import { Skeleton } from "@/shared/ui/skeleton";
import { usePublicSite } from "../hooks/use-purchase";

const minorWords = new Set([
  "de",
  "du",
  "des",
  "la",
  "le",
  "les",
  "l",
  "d",
  "et",
  "à",
  "au",
  "aux",
]);

/** « Café du Port » → « CP » : sans les petits mots ; un seul mot → ses deux premières lettres. */
export function initials(name: string) {
  const all = name
    .trim()
    .split(/[\s'’-]+/)
    .filter(Boolean);
  const words = all.filter((word) => !minorWords.has(word.toLowerCase()));
  const used = words.length ? words : all;
  const letters =
    used.length > 1 ? used[0][0] + used[1][0] : (used[0] ?? "").slice(0, 2);
  return letters.toUpperCase();
}

/**
 * En-tête du parcours d'achat, à la manière d'un paiement en ligne : le lieu qui vend l'accès
 * (initiales, nom, ville), sans séparateur. La sécurité du paiement est rappelée sous le bouton
 * « Payer », au moment où elle compte.
 */
export function PurchaseHeader({ siteId }: { siteId: string | undefined }) {
  const site = usePublicSite(siteId);
  return (
    <header className="px-4 pt-5 pb-2 sm:pt-8">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {site.isPending && siteId ? (
            <>
              <Skeleton className="size-10 rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </>
          ) : (
            <>
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-heading text-sm font-semibold text-primary"
              >
                {site.data ? (
                  initials(site.data.name)
                ) : (
                  <HugeiconsIcon
                    icon={Wifi01Icon}
                    strokeWidth={2}
                    className="size-5"
                  />
                )}
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate font-heading text-[0.9375rem] font-semibold tracking-tight">
                  {site.data?.name ?? "Accès Wi-Fi"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {site.data?.city ? `Wi-Fi · ${site.data.city}` : "Wi-Fi"}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
