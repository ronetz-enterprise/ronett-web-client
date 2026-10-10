import { Link, useNavigate } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { usePublicOffer, formatPrice } from "@/features/offer";
import { PageHeader, PageLoading } from "@/shared/components/feedback";
import { IconTile } from "@/shared/components/icon-tile";
import { Button } from "@/shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { useStartPurchase } from "../hooks/use-purchase";
import { PaymentForm } from "./payment-form";
import {
  OfferChips,
  OfferConditions,
  PublicFailure,
  PurchaseSteps,
  publicPurchaseRoutes,
  purchaseErrorMessage,
} from "./purchase-shared";

/**
 * Étape 2 : récapitulatif de l'offre et paiement mobile money. À l'envoi, l'achat est créé puis
 * la demande de paiement part vers le téléphone ; la suite se passe sur la page de suivi.
 */
export function PurchaseReview({
  siteId,
  offerId,
}: {
  siteId: string;
  offerId: string;
}) {
  const query = usePublicOffer(siteId, offerId);
  const start = useStartPurchase(siteId, offerId);
  const navigate = useNavigate();
  const back = (
    <Button
      nativeButton={false}
      role="link"
      variant="ghost"
      className="-ml-2 min-h-11 px-2"
      render={<Link to={publicPurchaseRoutes.offers(siteId)} />}
    >
      <HugeiconsIcon
        icon={ArrowLeft01Icon}
        strokeWidth={1.75}
        data-icon="inline-start"
        aria-hidden="true"
      />
      Changer d’offre
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
  const price = formatPrice(offer.price.amount, offer.price.currencyCode);
  return (
    <div className="mx-auto max-w-xl space-y-6 pb-32 sm:pb-0">
      <PurchaseSteps current={1} />
      {back}
      <PageHeader
        title="Paiement"
        description="Payez avec votre compte Mobile Money. Votre accès s’active juste après."
      />

      <section
        aria-label="Votre offre"
        className="space-y-4 rounded-xl border bg-card p-4 sm:p-5"
      >
        <div className="flex items-start gap-3">
          <IconTile type="access" />
          <div className="min-w-0 flex-1">
            <h2 className="font-medium break-words">{offer.name}</h2>
            {offer.description && (
              <p className="mt-0.5 text-sm break-words whitespace-pre-wrap text-muted-foreground">
                {offer.description}
              </p>
            )}
          </div>
          <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
            {price}
          </p>
        </div>
        <OfferChips offer={offer} />
        <Collapsible>
          <CollapsibleTrigger
            render={<Button variant="link" className="h-auto px-0 text-sm" />}
          >
            Voir toutes les conditions
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <OfferConditions offer={offer} />
            <p className="mt-3 text-xs text-muted-foreground">
              La durée démarre dès que votre accès est activé, juste après le
              paiement.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </section>

      <section aria-label="Paiement mobile money" className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Payer avec Mobile Money
        </h2>
        <PaymentForm
          submitLabel={`Payer ${price}`}
          pending={start.isPending}
          error={start.isError ? purchaseErrorMessage(start.error) : null}
          onSubmit={(values) =>
            start.mutate(values, {
              onSuccess: ({ purchaseId }) =>
                void navigate(
                  publicPurchaseRoutes.purchase(siteId, purchaseId),
                ),
            })
          }
        />
      </section>
    </div>
  );
}
