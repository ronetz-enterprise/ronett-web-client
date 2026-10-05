import { SettingsSection } from "@/shared/components/settings-layout";
import { useFormDialog } from "@/shared/components/form-dialog-context";
import { Link } from "react-router";
import { StatusBadge } from "@/shared/components/feedback";
import { QueryFailure } from "@/shared/components/query-feedback";
import { ApiError } from "@/shared/errors/api-error";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/shared/ui/breadcrumb";
import { offerRoutes, statusLabels, type Offer } from "../model/offer";
import { formatDuration, formatQuota, formatRate } from "../formatters/offer";
export function OfferStatus({ offer }: { offer: Offer }) {
  return (
    <StatusBadge
      label={statusLabels[offer.status]}
      tone={
        offer.status === "PUBLISHED"
          ? "success"
          : offer.status === "SUSPENDED"
            ? "warning"
            : "neutral"
      }
    />
  );
}
/** Section de formulaire d'offre : section à plat du gabarit paramètres, champs empilés. */
export function OfferPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  // En modale, le titre de la modale nomme déjà la section.
  if (useFormDialog()) return <div className="space-y-6">{children}</div>;
  return (
    // Sections d'un même formulaire, séparées par un trait comme dans `SettingsBody`.
    <SettingsSection
      title={title}
      description={description}
      className="border-t pt-10 first:border-t-0 first:pt-0"
    >
      <div className="max-w-sm space-y-5">{children}</div>
    </SettingsSection>
  );
}
/** Conditions d'accès en mots du gérant (sans unités techniques ni doublons). */
export function policyRows(policy: Offer["accessPolicy"]): [string, string][] {
  return [
    ["Durée d’accès", formatDuration(policy.validitySeconds)],
    ["Volume de données", formatQuota(policy.dataAllowanceBytes)],
    ["Vitesse de téléchargement", formatRate(policy.downloadLimitBps)],
    ["Vitesse d’envoi", formatRate(policy.uploadLimitBps)],
    ["Connexions simultanées", policy.maxConcurrentSessions],
  ];
}
export function AccessPolicySummary({
  policy,
}: {
  policy: Offer["accessPolicy"];
}) {
  const dialog = useFormDialog();
  return (
    <dl
      className={
        dialog ? "grid gap-4 text-sm" : "grid gap-4 text-sm sm:grid-cols-2"
      }
    >
      {policyRows(policy).map(([label, value]) => (
        <div className="min-w-0" key={label}>
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="break-words font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function OfferBreadcrumb({
  org,
  site,
  current,
}: {
  org: string;
  site?: { id: string; name: string };
  current: string;
}) {
  return (
    <Breadcrumb aria-label="Fil d’Ariane des offres">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to={offerRoutes.home(org)} />}>
            Offres
          </BreadcrumbLink>
        </BreadcrumbItem>
        {site && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                className="max-w-48 truncate"
                render={<Link to={offerRoutes.home(org, site.id)} />}
              >
                {site.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage role={undefined} aria-disabled={undefined}>
            {current}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
export function OfferFailure({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div className="space-y-3">
      <QueryFailure error={error} retry={retry} />
      {error instanceof ApiError && error.status === 409 && (
        <Alert>
          <AlertTitle>Les conditions ont changé</AlertTitle>
          <AlertDescription>
            Rechargez les informations et vérifiez le statut, le site et la
            devise avant de renouveler cette action. Votre saisie reste
            conservée dans le formulaire.
          </AlertDescription>
        </Alert>
      )}
      {error instanceof ApiError &&
        ["network", "timeout", "invalid-response"].includes(error.kind) && (
          <p className="text-sm text-muted-foreground">
            Le résultat peut être incertain. Consultez la liste ou le détail
            avant de renouveler une création ou une modification.
          </p>
        )}
    </div>
  );
}
