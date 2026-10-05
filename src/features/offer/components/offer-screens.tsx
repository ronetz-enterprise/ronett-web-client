import {
  SettingsBody,
  SettingsSection,
} from "@/shared/components/settings-layout";
import { DetailTabs } from "@/shared/components/detail-tabs";
import { CopyableId } from "@/shared/components/copyable-id";
import { useFormDialog } from "@/shared/components/form-dialog-context";
import { Link } from "react-router";
import type { Membership } from "@/features/memberships";
import { siteRoutes, useSite } from "@/features/site";
import { useOrganization } from "@/features/organizations";
import { PageHeader, PageLoading } from "@/shared/components/feedback";
import { RelativeTime } from "@/shared/components/relative-time";
import { OfferPortalPreview } from "./offer-preview";
import { ApiError } from "@/shared/errors/api-error";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import {
  offerRoutes,
  offerCapabilities,
  type CreateValues,
} from "../model/offer";
import type { ReactNode } from "react";
import { useOffer } from "../queries/offers";
import { OfferForm } from "./offer-form";
import { OfferActions } from "./offer-actions";
import { OfferStatus, OfferBreadcrumb, OfferFailure } from "./offer-shared";
function recoverable(error: unknown) {
  return (
    error instanceof ApiError &&
    (["network", "timeout", "aborted"].includes(error.kind) ||
      error.status >= 500 ||
      error.status === 429)
  );
}
export function OfferCreate({
  active,
  siteId,
  siteField,
  draft,
}: {
  active: Membership;
  siteId: string;
  /** Création en modale : champ de choix du site et saisie conservée entre deux sites. */
  siteField?: ReactNode;
  draft?: { current: Partial<CreateValues> };
}) {
  const query = useSite(active, siteId),
    organization = useOrganization(active);
  const dialog = useFormDialog();
  if (!offerCapabilities(active).canViewOffers)
    return <OfferFailure error={new ApiError("http", 403)} />;
  if (query.isPending || organization.isPending)
    return <PageLoading variant="detail" />;
  if (
    !query.data ||
    !organization.data ||
    (query.isError && !recoverable(query.error)) ||
    (organization.isError && !recoverable(organization.error))
  )
    return (
      <OfferFailure
        error={query.error || organization.error}
        retry={() => {
          void query.refetch();
          void organization.refetch();
        }}
      />
    );
  const site = query.data;
  if (!offerCapabilities(active, site).canCreateOffer)
    return (
      <Alert>
        <AlertTitle>Création indisponible</AlertTitle>
        <AlertDescription>
          La création nécessite un site actif.
          <Link
            className="underline"
            to={offerRoutes.list(active.organizationId, siteId)}
          >
            {" "}
            Consulter les offres
          </Link>
        </AlertDescription>
      </Alert>
    );
  return (
    <div className={dialog ? "space-y-6" : "max-w-2xl space-y-6"}>
      {!dialog && (
        <PageHeader
          title="Créer une offre"
          description={`Un brouillon pour ${site.name}, dans ${active.organizationName}.`}
          breadcrumb={
            <OfferBreadcrumb
              org={active.organizationId}
              site={site}
              current="Nouvelle offre"
            />
          }
        />
      )}
      {(query.isError || organization.isError) && (
        <OfferFailure
          error={query.error || organization.error}
          retry={() => {
            void query.refetch();
            void organization.refetch();
          }}
        />
      )}
      <OfferForm
        disabled={query.isError || organization.isError}
        key={`${site.id}/${organization.data.currency}`}
        active={active}
        site={site}
        currency={organization.data.currency}
        siteField={siteField}
        draft={draft}
      />
    </div>
  );
}
export function OfferDetails({
  active,
  siteId,
  offerId,
  tab = "overview",
}: {
  active: Membership;
  siteId: string;
  offerId: string;
  /** Aperçu (lecture), Prix et accès / Présentation (modification en place, champ par champ). */
  tab?: OfferTab;
}) {
  const query = useOffer(active, siteId, offerId),
    organization = useOrganization(active);
  if (!offerCapabilities(active).canViewOffers)
    return <OfferFailure error={new ApiError("http", 403)} />;
  if (query.isPending || organization.isPending)
    return <PageLoading variant="detail" />;
  if (
    !query.data ||
    !organization.data ||
    (query.isError && !recoverable(query.error)) ||
    (organization.isError && !recoverable(organization.error))
  )
    return (
      <OfferFailure
        error={query.error || organization.error}
        retry={() => {
          void query.refetch();
          void organization.refetch();
        }}
      />
    );
  const { offer, site } = query.data,
    currency = organization.data.currency,
    caps = offerCapabilities(active, site, offer, currency);
  const org = active.organizationId;
  const fetchFailed = query.isError || organization.isError;
  const editable = !fetchFailed && caps.canEditOffer;
  return (
    <div className="space-y-6">
      <PageHeader
        title={offer.name}
        status={<OfferStatus offer={offer} />}
        breadcrumb={
          <OfferBreadcrumb org={org} site={site} current={offer.name} />
        }
        actions={
          !fetchFailed && (
            <OfferActions
              active={active}
              site={site}
              offer={offer}
              currency={currency}
            />
          )
        }
        tabs={
          <DetailTabs
            label={`Sections de l’offre ${offer.name}`}
            tabs={[
              {
                label: "Aperçu",
                to: offerRoutes.detail(org, site.id, offer.offerId),
              },
              {
                label: "Prix et accès",
                to: offerRoutes.settings(org, site.id, offer.offerId),
              },
              {
                label: "Présentation",
                to: offerRoutes.presentation(org, offer.offerId),
              },
            ]}
          />
        }
      />
      {fetchFailed && (
        <OfferFailure
          error={query.error || organization.error}
          retry={() => {
            void query.refetch();
            void organization.refetch();
          }}
        />
      )}
      {tab !== "overview" && site.status !== "ACTIVE" && (
        <Alert>
          <AlertTitle>Site inactif</AlertTitle>
          <AlertDescription>
            La modification exige un site actif. La suspension et l’archivage
            restent possibles.
          </AlertDescription>
        </Alert>
      )}
      {tab !== "overview" && offer.status === "ARCHIVED" && (
        <Alert>
          <AlertTitle>Offre archivée</AlertTitle>
          <AlertDescription>
            Une offre archivée ne se modifie plus. Ses réglages restent
            consultables.
          </AlertDescription>
        </Alert>
      )}
      {offer.price.currencyCode !== currency && (
        <Alert>
          <AlertTitle>Devise à mettre à jour</AlertTitle>
          <AlertDescription>
            L’organisation utilise {currency}. Corrigez le prix dans « Prix et
            accès » avant toute autre modification ou publication.
          </AlertDescription>
        </Alert>
      )}
      {tab === "overview" ? (
        <SettingsBody>
          <SettingsSection
            id="clients"
            title="Vu par vos clients"
            description="L’offre telle qu’elle apparaît sur le portail WiFi, avant l’achat."
          >
            <div className="max-w-64">
              <OfferPortalPreview offer={offer} siteName={site.name} />
            </div>
          </SettingsSection>
          <SettingsSection
            id="references"
            title="Références"
            description="Fixées à la création de l’offre."
          >
            <dl className="grid max-w-md grid-cols-[auto_minmax(0,1fr)] gap-x-8 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Site</dt>
              <dd>
                <Link
                  className="underline underline-offset-4"
                  to={siteRoutes.detail(org, site.id)}
                >
                  {site.name}
                </Link>
              </dd>
              <dt className="text-muted-foreground">Identifiant</dt>
              <dd className="flex min-w-0 items-center gap-1">
                <CopyableId
                  value={offer.offerId}
                  label="identifiant de l’offre"
                />
              </dd>
              <dt className="text-muted-foreground">Créée</dt>
              <dd>
                <RelativeTime value={offer.createdAt} />
              </dd>
              <dt className="text-muted-foreground">Dernière modification</dt>
              <dd>
                <RelativeTime value={offer.updatedAt} />
              </dd>
            </dl>
          </SettingsSection>
        </SettingsBody>
      ) : (
        // Modification en place : chaque champ s'enregistre seul (✓ / ✗ après le champ).
        <div className="max-w-3xl min-w-0">
          <OfferForm
            key={`${offer.offerId}/${tab}`}
            active={active}
            site={site}
            currency={currency}
            offer={offer}
            parts={
              tab === "pricing"
                ? caps.canEditOffer || !caps.canEditPrice
                  ? ["price", "policy"]
                  : ["price"]
                : ["details", "order"]
            }
            disabled={
              tab === "pricing" && !caps.canEditOffer
                ? fetchFailed || !caps.canEditPrice
                : !editable
            }
          />
        </div>
      )}
    </div>
  );
}

export type OfferTab = "overview" | "pricing" | "presentation";
