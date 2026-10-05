import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import type { Membership } from "@/features/memberships";
import {
  routerCapabilities,
  routerRoutes,
  useRouterList,
} from "@/features/router";
import type { Site } from "@/features/site";
import { offerRoutes, useOffers } from "@/features/offer";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";

/**
 * Premier parcours sur un site : installer un routeur, puis publier une offre. Rien n'est
 * affiché quand le site est prêt à vendre, ni pendant le chargement.
 */
export function SiteNextStep({
  active,
  site,
}: {
  active: Membership;
  site: Site;
}) {
  const siteId = site.id;
  const routers = useRouterList(active, 0, 100);
  const offers = useOffers(active, siteId, 0, 1);
  if (!routers.data || !offers.data) return null;

  const hasRouter = routers.data.content.some(
    (router) => router.siteId === siteId,
  );
  const hasOffer = offers.data.content.length > 0;
  if (hasRouter && hasOffer) return null;
  // Sans droit d'ajout ou sur un site inactif, l'étape mènerait à une impasse.
  if (
    !hasRouter &&
    (!routerCapabilities(active).canCreateRouter || site.status !== "ACTIVE")
  )
    return null;

  const step = !hasRouter
    ? {
        title: "Prochaine étape : ajouter un routeur",
        description:
          "Le routeur diffuse le WiFi de ce site et authentifie vos clients.",
        to: routerRoutes.create(active.organizationId, siteId),
        action: "Ajouter un routeur",
      }
    : {
        title: "Prochaine étape : publier une offre",
        description:
          "Une offre définit ce que vos clients achètent : durée, volume et prix.",
        to: offerRoutes.create(active.organizationId, siteId),
        action: "Créer une offre",
      };

  return (
    <Alert>
      <AlertTitle>{step.title}</AlertTitle>
      <AlertDescription>{step.description}</AlertDescription>
      <AlertAction>
        <Button size="sm" nativeButton={false} render={<Link to={step.to} />}>
          {step.action}
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            data-icon="inline-end"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </Button>
      </AlertAction>
    </Alert>
  );
}
