import { useParams } from "react-router";
import { useActiveOrganization } from "@/features/organizations";
import { OfferDetails, useOfferSite } from "@/features/offer";
import { PageLoading } from "@/shared/components/feedback";
import { QueryFailure } from "@/shared/components/query-feedback";

/** Fiche d'une offre, onglet « Aperçu » : le site est retrouvé depuis l'offre. */
export default function Page() {
  const active = useActiveOrganization();
  const { offerId = "" } = useParams();
  const site = useOfferSite(active, offerId);
  if (site.isPending) return <PageLoading variant="detail" />;
  if (site.isError)
    return (
      <QueryFailure error={site.error} retry={() => void site.refetch()} />
    );
  return (
    <OfferDetails
      key={active.organizationId + "/" + offerId}
      active={active}
      siteId={site.data}
      offerId={offerId}
      tab="overview"
    />
  );
}
