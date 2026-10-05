import { FormDialogContent } from "@/shared/components/form-dialog";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { useForm } from "react-hook-form";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogFooter } from "@/shared/ui/dialog";
import { FormField, ValidatedForm } from "@/shared/components/form";
import { zodResolver } from "@/shared/components/form-utils";
import {
  EmptyState,
  PageLoading,
  PageHeader,
} from "@/shared/components/feedback";
import { businessStatusTone } from "@/shared/components/status";
import { toUserMessage } from "@/shared/errors/api-error";
import { formatDateTime } from "../formatters/platform";
import {
  auditActorLabels,
  auditResultLabels,
  auditResultTones,
  auditSeverityLabels,
  auditSeverityTones,
  organizationActionDescriptions,
  organizationActionLabels,
  organizationActions,
  organizationActionFormSchema,
  type OrganizationActionForm,
  organizationStatusLabels,
  platformCapabilities,
  platformLabel,
  platformRoutes,
  type OrganizationAction,
  type PlatformSession,
} from "../model/platform";
import {
  useOrganizationAction,
  usePlatformOrganization,
} from "../queries/platform";
import {
  PlatformFailure,
  PlatformForbidden,
  PlatformMetrics,
  PlatformSection,
  PlatformTable,
  StatusBadge,
  formatCount,
} from "./platform-shared";

/**
 * Fiche plateforme d'une organisation.
 *
 * La vue ne charge qu'un extrait des sites et du journal : l'exhaustif reste
 * dans les écrans dédiés, paginés.
 */
export function PlatformOrganizationDetails({
  session,
}: {
  session: PlatformSession;
}) {
  const { organizationId = "" } = useParams();
  const capabilities = platformCapabilities(session);
  const organization = usePlatformOrganization(
    capabilities.canReadOrganizations ? session : undefined,
    organizationId,
  );
  const action = useOrganizationAction();
  const [pending, setPending] = useState<OrganizationAction | null>(null);

  if (!capabilities.canReadOrganizations)
    return (
      <div className="space-y-6">
        <PageHeader
          title="Organisation"
          description="Consultation depuis la plateforme."
        />
        <PlatformForbidden area="La fiche d'une organisation" />
      </div>
    );

  if (organization.isPending) return <PageLoading variant="detail" />;
  if (organization.isError || !organization.data)
    return (
      <PlatformFailure
        error={organization.error}
        retry={() => void organization.refetch()}
      />
    );

  const data = organization.data;
  const available = organizationActions(data, capabilities);

  return (
    <div className="space-y-8">
      <PageHeader
        title={data.name}
        description="Fiche plateforme : aucune donnée n'est lue depuis un espace organisation."
        breadcrumb={
          <nav
            aria-label="Fil d'Ariane"
            className="text-sm text-muted-foreground"
          >
            <Link
              className="underline underline-offset-4"
              to={platformRoutes.organizations}
            >
              Organisations
            </Link>{" "}
            / {data.name}
          </nav>
        }
        status={
          <StatusBadge
            label={organizationStatusLabels[data.status]}
            tone={businessStatusTone[data.status]}
          />
        }
        actions={available.map((value) => (
          <Button
            key={value}
            variant={value === "suspend" ? "outline" : "default"}
            onClick={() => setPending(value)}
          >
            {organizationActionLabels[value]}
          </Button>
        ))}
      />

      <PlatformSection
        title="Situation"
        description="État plateforme de l'organisation."
      >
        <PlatformMetrics
          items={[
            {
              label: "Devise",
              value: data.currency,
              context: "Devise de tenue des soldes",
            },
            {
              label: "Sites",
              value: formatCount(data.sites.length),
              context: "Extrait des sites de l'organisation",
            },
            {
              label: "Routeurs en ligne",
              value: formatCount(data.routers.online),
              context: `${formatCount(data.routers.total)} routeurs · ${formatCount(data.routers.offline)} hors ligne`,
            },
            {
              label: "Créée le",
              value: formatDateTime(data.createdAt),
              context: data.suspendedAt
                ? `Suspendue le ${formatDateTime(data.suspendedAt)}`
                : "Jamais suspendue",
            },
          ]}
        />
        {data.suspensionReason && (
          <p className="text-sm text-muted-foreground">
            Motif de suspension : {data.suspensionReason}
          </p>
        )}
      </PlatformSection>

      <PlatformSection title="Sites" description="Extrait des sites rattachés.">
        {data.sites.length === 0 ? (
          <EmptyState
            title="Aucun site"
            description="Cette organisation n'a pas encore de site rattaché."
          />
        ) : (
          <PlatformTable>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.sites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell className="font-medium">{site.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {site.city}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={organizationStatusLabels[site.status]}
                      tone={businessStatusTone[site.status]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </PlatformTable>
        )}
      </PlatformSection>

      <PlatformSection
        title="Journal d'audit de l'organisation"
        description="Extrait des derniers événements, filtres complets dans le journal plateforme."
      >
        {data.recentAuditEntries.length === 0 ? (
          <EmptyState
            title="Aucun événement"
            description="Aucun événement n'a encore été journalisé pour cette organisation."
          />
        ) : (
          <PlatformTable>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Auteur</TableHead>
                <TableHead>Résultat</TableHead>
                <TableHead>Gravité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentAuditEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(entry.occurredAt)}
                  </TableCell>
                  <TableCell className="font-medium">{entry.action}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {platformLabel(auditActorLabels, entry.actor.type)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={platformLabel(auditResultLabels, entry.result)}
                      tone={auditResultTones[entry.result] ?? "neutral"}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={platformLabel(auditSeverityLabels, entry.severity)}
                      tone={auditSeverityTones[entry.severity] ?? "neutral"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </PlatformTable>
        )}
      </PlatformSection>

      {pending && (
        <Dialog
          open
          onOpenChange={(open) =>
            !open && !action.isPending && setPending(null)
          }
        >
          <FormDialogContent
            title={organizationActionLabels[pending]}
            description={
              <>
                {organizationActionDescriptions[pending]} Organisation «{" "}
                {data.name} ».
              </>
            }
            onClose={() => !action.isPending && setPending(null)}
            showCloseButton={!action.isPending}
          >
            <ActionForm
              busy={action.isPending}
              submitLabel={organizationActionLabels[pending]}
              error={action.error}
              onSubmit={(reason) =>
                action.mutate(
                  { organizationId: data.id, action: pending, reason },
                  { onSuccess: () => setPending(null) },
                )
              }
            />
          </FormDialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ActionForm({
  busy,
  submitLabel,
  error,
  onSubmit,
}: {
  busy: boolean;
  submitLabel: string;
  error: unknown;
  onSubmit: (reason: string) => void;
}) {
  const form = useForm<OrganizationActionForm>({
    resolver: zodResolver(organizationActionFormSchema),
    defaultValues: { reason: "" },
  });
  return (
    <ValidatedForm
      form={form}
      submitLabel={submitLabel}
      disabled={busy}
      onSubmit={(values) => onSubmit(values.reason)}
      footer={
        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy}>
            Fermer
          </Button>
        </DialogFooter>
      }
    >
      <FormField
        name="reason"
        label="Motif"
        description="Entre 10 et 1 000 caractères, conservé dans le journal d'audit."
      />
      {error !== null && error !== undefined && (
        <p role="alert" className="text-sm text-destructive">
          {toUserMessage(error)}
        </p>
      )}
    </ValidatedForm>
  );
}
