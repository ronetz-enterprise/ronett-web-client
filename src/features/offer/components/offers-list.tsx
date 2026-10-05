import { Link, useSearchParams } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import type { Membership } from "@/features/memberships";
import { EmptyState, PageLoading } from "@/shared/components/feedback";
import { cn } from "@/shared/utils/cn";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/shared/ui/pagination";
import { ApiError } from "@/shared/errors/api-error";
import { useOffers } from "../queries/offers";
import { offerCapabilities, offerRoutes, type Offer } from "../model/offer";
import { formatPrice, formatDuration, formatQuota } from "../formatters/offer";
import { OfferFailure, OfferStatus } from "./offer-shared";

/** Durée réduite à son unité principale pour la vignette : « 24 / heures », « 7 / jours ». */
function durationTile(seconds: string) {
  const value = BigInt(seconds);
  for (const [unit, one, many] of [
    [86400n, "jour", "jours"],
    [3600n, "heure", "heures"],
    [60n, "minute", "minutes"],
  ] as const) {
    if (value >= unit && value % unit === 0n) {
      const count = value / unit;
      return { count: String(count), label: count === 1n ? one : many };
    }
  }
  return null;
}

/** Teinte de la vignette selon la durée : courte (heures), journée, longue (semaine et plus). */
function durationTone(seconds: string) {
  const value = BigInt(seconds);
  // Jetons du thème (clair et sombre gérés) : bleu, vert, ambre.
  if (value < 86400n) return "bg-info text-info-foreground";
  if (value < 604800n) return "bg-success text-success-foreground";
  return "bg-warning text-warning-foreground";
}

/** Carte d'offre compacte : vignette de durée, statut, nom, puis prix · quota. */
export function OfferCard({
  offer,
  to,
  siteName,
}: {
  offer: Offer;
  to: string;
  /** Affiché quand la liste mélange plusieurs sites. */
  siteName?: string;
}) {
  const tile = durationTile(offer.accessPolicy.validitySeconds);
  const published = offer.status === "PUBLISHED";
  return (
    <li className="group relative flex flex-col gap-3 rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/40 has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50">
      <div className="flex items-start justify-between gap-3">
        <div
          aria-hidden="true"
          className={cn(
            "flex size-12 shrink-0 flex-col items-center justify-center rounded-xl leading-none",
            published
              ? durationTone(offer.accessPolicy.validitySeconds)
              : "bg-muted text-muted-foreground",
          )}
        >
          {tile ? (
            <>
              <span className="text-lg font-semibold tabular-nums">
                {tile.count}
              </span>
              <span className="mt-0.5 text-[10px]">{tile.label}</span>
            </>
          ) : (
            <span className="px-1 text-center text-[10px] font-medium">
              {formatDuration(offer.accessPolicy.validitySeconds)}
            </span>
          )}
        </div>
        <OfferStatus offer={offer} />
      </div>
      <div className="min-w-0 space-y-0.5">
        <Link
          to={to}
          className="block truncate font-medium outline-none after:absolute after:inset-0"
        >
          {offer.name}
        </Link>
        {siteName && (
          <p className="truncate text-xs text-muted-foreground">{siteName}</p>
        )}
        <p className="truncate text-sm text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">
            {formatPrice(offer.price.amount, offer.price.currencyCode)}
          </span>
          {" · "}
          {formatQuota(offer.accessPolicy.dataAllowanceBytes)}
          {" · "}
          {offer.accessPolicy.maxConcurrentSessions} appareil
          {offer.accessPolicy.maxConcurrentSessions === "1" ? "" : "s"}
        </p>
      </div>
    </li>
  );
}

/**
 * Onglet « Offres » d'un site : cartes d'offre et carte pointillée de création. L'en-tête et les
 * onglets sont fournis par l'espace du site.
 */
export function OffersList({
  active,
  siteId,
}: {
  active: Membership;
  siteId: string;
}) {
  const [params, setParams] = useSearchParams();
  const rawPage = params.get("page") ?? "0",
    rawSize = params.get("size") ?? "20";
  const page =
    /^\d{1,10}$/.test(rawPage) && Number(rawPage) <= 2147483647
      ? Number(rawPage)
      : 0;
  const size = [10, 20, 50, 100].includes(Number(rawSize))
    ? Number(rawSize)
    : 20;
  const query = useOffers(active, siteId, page, size);
  if (!offerCapabilities(active).canViewOffers)
    return <OfferFailure error={new ApiError("http", 403)} />;
  if (query.isPending) return <PageLoading />;
  if (query.isError)
    return (
      <OfferFailure error={query.error} retry={() => void query.refetch()} />
    );
  const { site, content, totalElements } = query.data;
  const caps = offerCapabilities(active, site);
  const create = (
    <Button
      nativeButton={false}
      role="link"
      render={<Link to={offerRoutes.create(active.organizationId, siteId)} />}
    >
      Créer une offre
    </Button>
  );
  const total = BigInt(totalElements),
    pages = (total + BigInt(size) - 1n) / BigInt(size);
  // Garde les autres paramètres de la page (le site choisi, par exemple).
  const changePage = (next: number, nextSize = size) => {
    const search = new URLSearchParams(params);
    search.set("page", String(next));
    search.set("size", String(nextSize));
    void setParams(search);
  };
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p role="status" className="text-muted-foreground">
          {totalElements} offre
          {totalElements === "1" || totalElements === "0" ? "" : "s"} · ordre
          d’affichage du portail
          {query.isFetching ? " · actualisation…" : ""}
        </p>
        <Button
          variant="ghost"
          size="sm"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <HugeiconsIcon
            icon={RefreshIcon}
            strokeWidth={1.75}
            data-icon="inline-start"
          />
          Actualiser
        </Button>
      </div>
      {!content.length ? (
        <EmptyState
          objectType="offer"
          title={
            page ? "Aucune offre sur cette page" : "Aucune offre pour ce site"
          }
          description={
            page
              ? "Revenez à la première page pour consulter les offres disponibles."
              : "Créez un brouillon, vérifiez ses conditions puis publiez-le : il apparaîtra sur le portail du site."
          }
          actions={
            page ? (
              <Button onClick={() => changePage(0)}>Première page</Button>
            ) : caps.canCreateOffer ? (
              create
            ) : undefined
          }
        />
      ) : (
        <ul
          aria-label={`Offres du site ${site.name}`}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
        >
          {content.map((offer) => (
            <OfferCard
              key={offer.offerId}
              offer={offer}
              to={offerRoutes.detail(
                active.organizationId,
                siteId,
                offer.offerId,
              )}
            />
          ))}
          {caps.canCreateOffer && (
            <li>
              <Link
                to={offerRoutes.create(active.organizationId, siteId)}
                className="flex h-full min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-4 text-sm font-medium text-muted-foreground transition-colors outline-none hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <HugeiconsIcon
                  icon={Add01Icon}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                Nouvelle offre
              </Link>
            </li>
          )}
        </ul>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span id="offer-size-label">Offres par page</span>
          <Select
            value={String(size)}
            onValueChange={(value) => {
              if (value) changePage(0, Number(value));
            }}
          >
            <SelectTrigger aria-labelledby="offer-size-label">
              <SelectValue>{size}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Pagination className="mx-0 w-auto" aria-label="Pagination des offres">
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                disabled={page === 0 || query.isFetching}
                onClick={() => changePage(page - 1)}
              >
                Précédente
              </Button>
            </PaginationItem>
            <PaginationItem>
              <span className="px-2 text-sm" aria-current="page">
                Page {page + 1} / {String(pages || 1n)}
              </span>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                disabled={
                  BigInt(page + 1) >= pages ||
                  page === 2147483647 ||
                  query.isFetching
                }
                onClick={() => changePage(page + 1)}
              >
                Suivante
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
