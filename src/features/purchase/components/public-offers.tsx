import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { usePublicOffers, formatPrice } from "@/features/offer";
import {
  PageHeader,
  PageLoading,
  EmptyState,
} from "@/shared/components/feedback";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/cn";
import { rememberHotspotLogin } from "../model/purchase-session";
import {
  OfferChips,
  PublicFailure,
  PurchaseSteps,
  publicPurchaseRoutes,
} from "./purchase-shared";

/**
 * Étape 1 : choix de l'offre. Le portail du hotspot peut passer sa page de connexion en
 * `?login=` : elle est retenue (adresse locale seulement) pour y renvoyer le client une fois
 * ses identifiants reçus.
 */
export function PublicOffers({ siteId }: { siteId: string }) {
  const [params, setParams] = useSearchParams();
  const login = params.get("login");
  useEffect(() => rememberHotspotLogin(siteId, login), [siteId, login]);
  const raw = params.get("page") ?? "0";
  const page =
    /^\d{1,10}$/.test(raw) && Number(raw) <= 2147483647 ? Number(raw) : 0;
  const query = usePublicOffers(siteId, page);
  if (query.isPending) return <PageLoading />;
  if (query.isError)
    return (
      <PublicFailure error={query.error} retry={() => void query.refetch()} />
    );
  const total = BigInt(query.data.totalElements),
    pages = (total + 19n) / 20n;
  const offers = query.data.content;
  const selectedId = params.get("offre");
  const selected = offers.find((offer) => offer.offerId === selectedId);
  function select(id: string) {
    const next = new URLSearchParams(params);
    next.set("offre", id);
    setParams(next, { replace: true, preventScrollReset: true });
  }
  return (
    <div className="space-y-6 pb-24 sm:pb-0">
      <PurchaseSteps current={0} />
      <PageHeader
        title="Choisissez votre accès Internet"
        description="Payez par Mobile Money et connectez-vous en quelques minutes."
      />
      {query.isFetching && (
        <p role="status" className="text-sm text-muted-foreground">
          Actualisation des offres…
        </p>
      )}
      {offers.length ? (
        <fieldset className="space-y-3">
          <legend className="sr-only">Offres disponibles</legend>
          {offers.map((offer) => {
            const checked = offer.offerId === selected?.offerId;
            return (
              <label
                key={offer.offerId}
                className={cn(
                  "flex cursor-pointer flex-col gap-3 rounded-xl border bg-card p-4 transition-colors has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50",
                  checked
                    ? "border-primary ring-2 ring-primary"
                    : "hover:bg-muted/50",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 font-medium break-words">
                    {offer.name}
                  </span>
                  <input
                    type="radio"
                    name="offre"
                    value={offer.offerId}
                    checked={checked}
                    onChange={() => select(offer.offerId)}
                    className="mt-1 size-4 shrink-0 accent-primary"
                  />
                </div>
                <span className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
                  {formatPrice(offer.price.amount, offer.price.currencyCode)}
                </span>
                <OfferChips offer={offer} />
                {offer.description && (
                  <span className="text-sm break-words whitespace-pre-wrap text-muted-foreground">
                    {offer.description}
                  </span>
                )}
              </label>
            );
          })}
        </fieldset>
      ) : (
        <EmptyState
          objectType="offer"
          title="Aucune offre disponible"
          description="Aucune offre ne peut être proposée avec ce lien pour le moment. Réessayez plus tard ou adressez-vous au responsable du point de connexion."
          actions={
            <Button
              variant="outline"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              Actualiser
            </Button>
          }
        />
      )}
      {offers.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 p-4 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0">
          {selected ? (
            <Button
              nativeButton={false}
              role="link"
              className="min-h-11 w-full"
              render={
                <Link
                  to={publicPurchaseRoutes.review(siteId, selected.offerId)}
                />
              }
            >
              Continuer avec {selected.name}
            </Button>
          ) : (
            <Button className="min-h-11 w-full" disabled>
              Choisissez une offre
            </Button>
          )}
        </div>
      )}
      {pages > 1n && (
        <nav
          aria-label="Pages d’offres"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <Button
            variant="outline"
            disabled={page === 0 || query.isFetching}
            onClick={() => void setParams({ page: String(page - 1) })}
          >
            Précédente
          </Button>
          <span className="text-sm">
            Page {page + 1} / {String(pages || 1n)}
          </span>
          <Button
            variant="outline"
            disabled={
              BigInt(page + 1) >= pages ||
              page === 2147483647 ||
              query.isFetching
            }
            onClick={() => void setParams({ page: String(page + 1) })}
          >
            Suivante
          </Button>
        </nav>
      )}
      {page > 0 && !query.data.content.length && (
        <Button onClick={() => void setParams({})}>Première page</Button>
      )}
    </div>
  );
}
