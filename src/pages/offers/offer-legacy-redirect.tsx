import { Navigate, useLocation, useParams } from "react-router";
import { useActiveOrganization } from "@/features/organizations";
import { offerRoutes } from "@/features/offer";

/** Anciennes adresses (`sites/:siteId/offers/:offerId[/settings]`, `offers/:offerId/settings`) : redirigées vers la fiche sous /offers. */
export default function OfferLegacyRedirect() {
  const active = useActiveOrganization();
  const { siteId = "", offerId = "" } = useParams();
  const settings = useLocation().pathname.endsWith("/settings");
  const to = (settings ? offerRoutes.settings : offerRoutes.detail)(
    active.organizationId,
    siteId,
    offerId,
  );
  return <Navigate replace to={to} />;
}
