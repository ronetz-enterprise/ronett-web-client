import { OffersHome } from "@/features/offer";
import { useActiveOrganization } from "@/features/organizations";

/** Entrée « Offres » de la barre latérale : choix du site, puis ses offres. */
export default function Page() {
  const active = useActiveOrganization();
  return <OffersHome key={active.organizationId} active={active} />;
}
