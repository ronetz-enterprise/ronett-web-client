import { Link, useSearchParams } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import type { Membership } from "@/features/memberships";
import { siteRoutes, siteStatusLabels, useSites } from "@/features/site";
import {
  EmptyState,
  PageHeader,
  PageLoading,
} from "@/shared/components/feedback";
import { QueryFailure } from "@/shared/components/query-feedback";
import { Button } from "@/shared/ui/button";
import { DataToolbar } from "@/shared/components/data-toolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { Site } from "@/features/site";
import { offerCapabilities, offerRoutes } from "../model/offer";
import { useAllOffers } from "../queries/offers";
import { OfferFailure } from "./offer-shared";
import { OfferCard, OffersList } from "./offers-list";

/**
 * Page « Offres » de la barre latérale : par défaut, toutes les offres de l'organisation. Le
 * filtre de site vit dans l'URL (`?site=`), on peut donc ouvrir la page déjà filtrée.
 */
export function OffersHome({ active }: { active: Membership }) {
  const [params, setParams] = useSearchParams();
  const sites = useSites(active);
  if (sites.isPending) return <PageLoading />;
  if (sites.isError)
    return (
      <QueryFailure error={sites.error} retry={() => void sites.refetch()} />
    );
  const list = sites.data;
  const requested = list.find((site) => site.id === params.get("site"));
  // Site proposé pour « Créer une offre » : le site filtré, sinon le premier site actif.
  const site =
    requested ?? list.find((s) => s.status === "ACTIVE") ?? list[0] ?? null;
  const canCreate = !!site && offerCapabilities(active, site).canCreateOffer;
  function choose(id: string) {
    // Changer de site repart de la première page de ses offres ; « ALL » retire le filtre.
    setParams(id === "ALL" ? {} : { site: id }, { replace: true });
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="Offres"
        actions={
          canCreate && (
            <Button
              nativeButton={false}
              role="link"
              render={
                <Link
                  to={offerRoutes.create(active.organizationId, requested?.id)}
                />
              }
            >
              <HugeiconsIcon
                icon={Add01Icon}
                strokeWidth={1.75}
                data-icon="inline-start"
              />
              Créer une offre
            </Button>
          )
        }
      />
      {!site ? (
        <EmptyState
          objectType="offer"
          variant="prerequisite"
          title="Créez d’abord un site"
          description="Une offre est toujours vendue sur le portail d’un site : le lieu où votre WiFi est proposé."
          actions={
            <Button
              nativeButton={false}
              role="link"
              render={<Link to={siteRoutes.create()} />}
            >
              Créer un site
            </Button>
          }
        />
      ) : (
        <>
          <DataToolbar
            filters={
              <Select
                value={requested?.id ?? "ALL"}
                onValueChange={(value) => choose(value ?? "ALL")}
              >
                <SelectTrigger
                  aria-label="Filtrer par site"
                  className="h-9 w-56"
                >
                  <SelectValue>
                    {() => requested?.name ?? "Tous les sites"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les sites</SelectItem>
                  {list.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.name}
                      {candidate.status !== "ACTIVE"
                        ? ` · ${siteStatusLabels[candidate.status]}`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
            active={
              requested
                ? [
                    {
                      key: "site",
                      label: `Site : ${requested.name}`,
                      onRemove: () => choose("ALL"),
                    },
                  ]
                : []
            }
          />
          {requested ? (
            <OffersList
              key={requested.id}
              active={active}
              siteId={requested.id}
            />
          ) : (
            <AllOffers active={active} sites={list} />
          )}
        </>
      )}
    </div>
  );
}

/** Offres de tous les sites réunies, chaque carte rappelant son site. */
function AllOffers({ active, sites }: { active: Membership; sites: Site[] }) {
  const query = useAllOffers(
    active,
    sites.map((site) => site.id),
  );
  if (query.isPending) return <PageLoading />;
  if (query.error)
    return (
      <OfferFailure error={query.error} retry={() => void query.refetch()} />
    );
  if (!query.offers.length)
    return (
      <EmptyState
        objectType="offer"
        title="Aucune offre pour le moment"
        description="Créez un brouillon, vérifiez ses conditions puis publiez-le : il apparaîtra sur le portail du site."
      />
    );
  return (
    <div className="min-w-0 space-y-4">
      <p role="status" className="text-sm text-muted-foreground">
        {query.offers.length} offre{query.offers.length === 1 ? "" : "s"} sur{" "}
        {sites.length} site{sites.length === 1 ? "" : "s"}
        {query.isFetching ? " · actualisation…" : ""}
      </p>
      <ul
        aria-label="Offres de tous les sites"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
      >
        {query.offers.map(({ offer, site }) => (
          <OfferCard
            key={offer.offerId}
            offer={offer}
            siteName={site.name}
            to={offerRoutes.detail(
              active.organizationId,
              site.id,
              offer.offerId,
            )}
          />
        ))}
      </ul>
    </div>
  );
}
