import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { usePublicOffers } from "@/features/offer";
import {
  PageHeader,
  PageLoading,
  EmptyState,
} from "@/shared/components/feedback";
import { Button } from "@/shared/ui/button";
import { rememberHotspotLogin } from "../model/purchase-session";
import { OfferTicket } from "./offer-ticket";
import { PublicFailure, publicPurchaseRoutes } from "./purchase-shared";

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
  return (
    <div className="mx-auto max-w-md space-y-6">
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
        <ul aria-label="Offres disponibles" className="space-y-2.5">
          {offers.map((offer) => (
            <li key={offer.offerId}>
              <OfferTicket
                offer={offer}
                to={publicPurchaseRoutes.review(siteId, offer.offerId)}
              />
            </li>
          ))}
        </ul>
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
