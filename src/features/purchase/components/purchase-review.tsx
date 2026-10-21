import { Link, useNavigate, useSearchParams } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import {
  usePublicOffer,
  formatPrice,
  type PublicOffer,
} from "@/features/offer";
import { PageLoading } from "@/shared/components/feedback";
import { Button } from "@/shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { usePaymentChannels, useStartPurchase } from "../hooks/use-purchase";
import { findChannel } from "../model/payment-channel";
import { ChannelList, ChannelLogo, PaymentForm } from "./payment-form";
import {
  OfferConditions,
  PublicFailure,
  publicPurchaseRoutes,
  purchaseErrorMessage,
} from "./purchase-shared";

/** Bouton icône de retour, en haut à gauche de chaque écran du paiement. */
function BackButton({ to, label }: { to: string; label: string }) {
  return (
    <Button
      nativeButton={false}
      variant="ghost"
      size="icon-lg"
      aria-label={label}
      className="-ml-2.5 rounded-full"
      render={<Link to={to} />}
    >
      <HugeiconsIcon
        icon={ArrowLeft01Icon}
        strokeWidth={2}
        aria-hidden="true"
      />
    </Button>
  );
}

/**
 * « Détail de mon achat » : fermé par défaut, la ligne rappelle l'offre et son prix ; ouvert, la
 * description puis les conditions en liste, sans carte.
 */
function PurchaseDetails({ offer }: { offer: PublicOffer }) {
  return (
    <Collapsible className="border-y">
      <CollapsibleTrigger className="group flex min-h-14 w-full items-center gap-3 py-3 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">Détail de mon achat</span>
          <span className="block truncate text-xs text-muted-foreground">
            {offer.name}
          </span>
        </span>
        <span className="font-heading font-semibold tabular-nums">
          {formatPrice(offer.price.amount, offer.price.currencyCode)}
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          aria-hidden="true"
          className="size-4 text-muted-foreground transition-transform duration-200 group-data-[panel-open]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pb-4">
        {offer.description && (
          <p className="text-sm break-words whitespace-pre-wrap text-muted-foreground">
            {offer.description}
          </p>
        )}
        <OfferConditions offer={offer} />
        <p className="text-xs text-muted-foreground">
          La durée démarre dès que votre accès est activé, juste après le
          paiement.
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Étape 2 : paiement, une question par écran. D'abord le moyen de paiement (liste), puis le
 * numéro à débiter ; le moyen choisi est dans l'URL (`?moyen=`), donc le retour du navigateur
 * revient à la liste. L'offre est rappelée dans « Détail de mon achat », replié par défaut. À l'envoi, l'achat est créé puis la demande part vers le téléphone.
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
  const channels = usePaymentChannels();
  const [params, setParams] = useSearchParams();
  const channel = findChannel(channels, params.get("moyen"));
  const offersPath = publicPurchaseRoutes.offers(siteId);
  const reviewPath = publicPurchaseRoutes.review(siteId, offerId);

  if (query.isPending) return <PageLoading />;
  if (query.isError)
    return (
      <div className="mx-auto max-w-md space-y-6">
        <BackButton to={offersPath} label="Retour aux offres" />
        <PublicFailure error={query.error} retry={() => void query.refetch()} />
      </div>
    );
  const offer = query.data;
  const price = formatPrice(offer.price.amount, offer.price.currencyCode);

  return (
    <div className="mx-auto max-w-md pb-32 sm:pb-0">
      <div className="space-y-6">
        <div className="space-y-3">
          {channel ? (
            <BackButton to={reviewPath} label="Changer de moyen de paiement" />
          ) : (
            <BackButton to={offersPath} label="Retour aux offres" />
          )}
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {channel ? "Votre numéro" : "Comment voulez-vous payer ?"}
          </h1>
        </div>

        <PurchaseDetails offer={offer} />

        {channel ? (
          <section aria-label="Numéro à débiter" className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5 text-sm">
              <ChannelLogo channel={channel} className="size-8" />
              <span className="min-w-0 flex-1 font-medium">
                {channel.label}
              </span>
              <Link
                to={reviewPath}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Changer
              </Link>
            </div>
            <PaymentForm
              channelId={channel.id}
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
        ) : (
          <section aria-label="Moyen de paiement">
            <ChannelList
              onSelect={(id) => {
                const next = new URLSearchParams(params);
                next.set("moyen", id);
                setParams(next, { preventScrollReset: true });
              }}
            />
          </section>
        )}
      </div>
    </div>
  );
}
