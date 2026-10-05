import { Link, useSearchParams } from "react-router";
import {
  usePublicOffer,
  usePublicOffers,
  formatPrice,
  formatDuration,
  formatQuota,
  formatRate,
  type PublicOffer,
} from "@/features/offer";
import {
  PageHeader,
  PageLoading,
  EmptyState,
} from "@/shared/components/feedback";
import { QueryFailure } from "@/shared/components/query-feedback";
import { ApiError } from "@/shared/errors/api-error";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Progress, ProgressLabel, ProgressValue } from "@/shared/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { IconTile } from "@/shared/components/icon-tile";
import { cn } from "@/shared/utils/cn";
export const publicPurchaseRoutes = {
  offers: (site: string) => `/connect/${site}`,
  review: (site: string, id: string) => `/connect/${site}/offers/${id}`,
};
function AvailabilityNotice() {
  return (
    <Alert>
      <AlertTitle>L’achat en ligne n’est pas encore disponible</AlertTitle>
      <AlertDescription>
        Vous pouvez consulter les offres et leurs conditions. Aucun achat ni
        paiement ne sera effectué sur cette page.
      </AlertDescription>
    </Alert>
  );
}
const purchaseSteps = ["Offre", "Paiement", "Connexion"];

/** Avancement de l'achat, mobile d'abord : étape courante et barre de progression. */
function PurchaseSteps({ current }: { current: number }) {
  return (
    <Progress
      value={((current + 1) / purchaseSteps.length) * 100}
      className="gap-2"
    >
      <ProgressLabel className="text-xs">
        Étape {current + 1} sur {purchaseSteps.length} ·{" "}
        {purchaseSteps[current]}
      </ProgressLabel>
      <ProgressValue className="text-xs">
        {() => purchaseSteps.slice(current + 1).join(" → ") || "Terminé"}
      </ProgressValue>
    </Progress>
  );
}

function OfferChips({ offer }: { offer: PublicOffer }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="secondary">
        {formatDuration(offer.accessPolicy.validitySeconds)}
      </Badge>
      <Badge variant="secondary">
        {formatQuota(offer.accessPolicy.dataAllowanceBytes)}
      </Badge>
      {offer.accessPolicy.downloadLimitBps && (
        <Badge variant="outline">
          {formatRate(offer.accessPolicy.downloadLimitBps)}
        </Badge>
      )}
    </div>
  );
}

function PublicFailure({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  if (error instanceof ApiError && [400, 403, 404].includes(error.status))
    return (
      <EmptyState
        title="Offre indisponible"
        description="Ce lien ne permet pas de consulter cette offre. Revenez aux offres disponibles ou utilisez le lien fourni sur le portail Wi-Fi."
      />
    );
  return <QueryFailure error={error} retry={retry} />;
}
function Policy({ offer }: { offer: PublicOffer }) {
  const p = offer.accessPolicy;
  const rows = [
    ["Durée après activation", formatDuration(p.validitySeconds)],
    ["Données incluses", formatQuota(p.dataAllowanceBytes)],
    ["Débit descendant", formatRate(p.downloadLimitBps)],
    ["Débit montant", formatRate(p.uploadLimitBps)],
    ["Sessions simultanées", p.maxConcurrentSessions],
  ];
  return (
    <dl className="space-y-3 text-sm">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex flex-wrap justify-between gap-x-4 gap-y-1"
        >
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 break-words font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function PublicOffers({ siteId }: { siteId: string }) {
  const [params, setParams] = useSearchParams();
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
        description="Sélectionnez l’offre qui vous convient, puis vérifiez ses conditions."
      />
      <AvailabilityNotice />
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
export function PurchaseReview({
  siteId,
  offerId,
}: {
  siteId: string;
  offerId: string;
}) {
  const query = usePublicOffer(siteId, offerId);
  const back = (
    <Button
      nativeButton={false}
      role="link"
      variant="outline"
      className="min-h-11"
      render={<Link to={publicPurchaseRoutes.offers(siteId)} />}
    >
      Revenir aux offres
    </Button>
  );
  if (query.isPending) return <PageLoading />;
  if (query.isError)
    return (
      <div className="space-y-6">
        <PublicFailure error={query.error} retry={() => void query.refetch()} />
        {back}
      </div>
    );
  const offer = query.data;
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PurchaseSteps current={1} />
      <PageHeader
        title="Récapitulatif"
        description="Vérifiez les conditions de votre accès avant le paiement."
      />
      <section className="space-y-5 rounded-xl border bg-card p-4 ring-2 ring-primary/20 sm:p-5">
        <div className="flex items-center gap-3">
          <IconTile type="access" />
          <h2 className="min-w-0 font-medium break-words">{offer.name}</h2>
        </div>
        <p className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
          {formatPrice(offer.price.amount, offer.price.currencyCode)}
        </p>
        <OfferChips offer={offer} />
        {offer.description && (
          <p className="text-sm break-words whitespace-pre-wrap">
            {offer.description}
          </p>
        )}
        <Policy offer={offer} />
        <p className="text-xs text-muted-foreground">
          La durée commence après activation. Les sessions simultanées ne
          représentent pas un nombre d’appareils. Les unités de données et de
          débit utilisent le système décimal.
        </p>
      </section>
      <section className="space-y-3 rounded-xl border border-dashed p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <IconTile type="sale" className="opacity-60" />
          <div>
            <h2 className="text-sm font-medium">Paiement mobile money</h2>
            <p className="text-xs text-muted-foreground">
              MTN Mobile Money ou Orange Money
            </p>
          </div>
        </div>
        <Button className="min-h-11 w-full" disabled>
          Payer {formatPrice(offer.price.amount, offer.price.currencyCode)}
        </Button>
      </section>
      <AvailabilityNotice />
      <p className="text-sm text-muted-foreground">
        Aucun achat n’a été créé. Aucune coordonnée personnelle n’est nécessaire
        pour consulter cette offre.
      </p>
      <div className="flex flex-wrap gap-3">
        {back}
        <Button
          variant="outline"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {query.isFetching ? "Actualisation…" : "Actualiser les conditions"}
        </Button>
      </div>
    </div>
  );
}
