import {
  formatDuration,
  formatQuota,
  formatRate,
  type PublicOffer,
} from "@/features/offer";
import { EmptyState } from "@/shared/components/feedback";
import { QueryFailure } from "@/shared/components/query-feedback";
import { ApiError } from "@/shared/errors/api-error";
import { Badge } from "@/shared/ui/badge";
import { Progress, ProgressLabel, ProgressValue } from "@/shared/ui/progress";

export const publicPurchaseRoutes = {
  offers: (site: string) => `/connect/${site}`,
  review: (site: string, id: string) => `/connect/${site}/offers/${id}`,
  purchase: (site: string, purchase: string) =>
    `/connect/${site}/purchases/${purchase}`,
};

const purchaseSteps = ["Offre", "Paiement", "Connexion"];

/** Avancement de l'achat, mobile d'abord : étape courante et barre de progression. */
export function PurchaseSteps({ current }: { current: number }) {
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

export function OfferChips({ offer }: { offer: PublicOffer }) {
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

/** Conditions de l'offre dans les mots du client. */
export function OfferConditions({ offer }: { offer: PublicOffer }) {
  const p = offer.accessPolicy;
  const rows = [
    ["Durée", formatDuration(p.validitySeconds)],
    ["Volume de données", formatQuota(p.dataAllowanceBytes)],
    ["Vitesse de téléchargement", formatRate(p.downloadLimitBps)],
    ["Vitesse d’envoi", formatRate(p.uploadLimitBps)],
    ["Appareils connectés en même temps", p.maxConcurrentSessions],
  ];
  return (
    <dl className="divide-y text-sm">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0"
        >
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 font-medium break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PublicFailure({
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

/** Messages des refus du serveur, sans vocabulaire technique. */
export function purchaseErrorMessage(error: unknown) {
  if (!(error instanceof ApiError))
    return "Une erreur inattendue est survenue. Veuillez réessayer.";
  if (error.kind === "network")
    return "Connexion impossible. Vérifiez que vous êtes bien connecté au WiFi, puis réessayez.";
  if (error.kind === "timeout")
    return "Le service met trop de temps à répondre. Réessayez dans un instant.";
  const code = error.problem?.detail ?? "";
  if (error.status === 429)
    return "Trop de tentatives en peu de temps. Patientez une minute avant de réessayer.";
  if (code === "InvalidPaymentRequest" || error.status === 400)
    return "Ce numéro ou cet opérateur ne peut pas être utilisé pour ce paiement. Vérifiez-les et réessayez.";
  if (code === "PaymentAlreadySucceeded") return "Ce paiement a déjà été reçu.";
  if (code === "PaymentReconciliationRequired")
    return "Un paiement est déjà en cours de validation pour cet achat. Patientez quelques instants.";
  if (error.status === 403)
    return "Ce paiement n’est plus possible : le délai est dépassé ou le nombre d’essais est atteint.";
  if (error.status === 404) return "Cette offre n’est plus disponible.";
  return "Le paiement n’a pas pu être lancé. Réessayez dans un instant.";
}
