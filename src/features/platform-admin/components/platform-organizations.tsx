import { FormDialogContent } from "@/shared/components/form-dialog";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Dialog } from "@/shared/ui/dialog";
import { FormField, ValidatedForm } from "@/shared/components/form";
import { zodResolver } from "@/shared/components/form-utils";
import { PageLoading, EmptyState } from "@/shared/components/feedback";
import { businessStatusTone } from "@/shared/components/status";
import { ApiError, toUserMessage } from "@/shared/errors/api-error";
import { formatDateTime } from "../formatters/platform";
import {
  organizationActionDescriptions,
  organizationActionLabels,
  organizationActions,
  organizationActionFormSchema,
  type OrganizationActionForm,
  organizationStatusLabels,
  organizationStatusOptions,
  platformCapabilities,
  platformRoutes,
  type OrganizationAction,
  type PlatformOrganization,
  type PlatformSession,
} from "../model/platform";
import {
  PLATFORM_PAGE_SIZE,
  PlatformFailure,
  PlatformForbidden,
  PlatformPageHeader,
  PlatformPagination,
  PlatformSection,
  PlatformTable,
  StatusBadge,
} from "./platform-shared";
import {
  useOrganizationAction,
  usePlatformOrganizations,
} from "../queries/platform";

const STATUS_ALL = "ALL";

function readPage(value: string | null) {
  return /^\d{1,6}$/.test(value ?? "") ? Number(value) : 0;
}

function readChoice(
  value: string | null,
  allowed: readonly string[],
  fallback: string,
) {
  return value && allowed.includes(value) ? value : fallback;
}

/**
 * Liste des organisations de la plateforme.
 *
 * Les filtres sont ceux que le backend accepte réellement : statut et recherche
 * textuelle, tous deux transmis à la requête.
 */
export function PlatformOrganizations({
  session,
}: {
  session: PlatformSession;
}) {
  const capabilities = platformCapabilities(session);
  const [params, setParams] = useSearchParams();
  const [pending, setPending] = useState<PendingAction | null>(null);

  const page = readPage(params.get("page"));
  const status = readChoice(
    params.get("status"),
    [STATUS_ALL, ...organizationStatusOptions],
    STATUS_ALL,
  );
  const query = params.get("q") ?? "";
  const sort = readChoice(
    params.get("sort"),
    ["createdAt", "name", "updatedAt"],
    "createdAt",
  );

  const organizations = usePlatformOrganizations(
    capabilities.canReadOrganizations ? session : undefined,
    { status, query, sort },
    page,
    PLATFORM_PAGE_SIZE,
  );
  const action = useOrganizationAction();
  const target = pending
    ? organizations.data?.content.find(
        (item) => item.id === pending.organizationId,
      )
    : undefined;

  function update(next: Record<string, string | null>) {
    const search = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value) search.set(key, value);
      else search.delete(key);
    }
    // Un filtre change invalide la page courante.
    search.delete("page");
    setParams(search, { replace: true, preventScrollReset: true });
  }

  function goToPage(next: number) {
    const search = new URLSearchParams(params);
    search.set("page", String(next));
    setParams(search, { preventScrollReset: true });
  }

  if (!capabilities.canReadOrganizations)
    return (
      <div className="space-y-6">
        <PlatformPageHeader
          title="Organisations"
          description="Toutes les organisations de la plateforme."
        />
        <PlatformForbidden area="La liste des organisations" />
      </div>
    );

  return (
    <div className="space-y-8">
      <PlatformPageHeader
        title="Organisations"
        description="Toutes les organisations, sans dépendre d'un espace organization."
      />

      <PlatformSection
        title="Recherche"
        description="Filtres transmis à la plateforme."
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-56 flex-1 flex-col gap-1.5">
            <label
              htmlFor="platform-organization-search"
              className="text-xs font-medium text-muted-foreground"
            >
              Nom ou identifiant
            </label>
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={1.75}
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="platform-organization-search"
                value={query}
                placeholder="Rechercher une organisation"
                className="pl-8"
                onChange={(event) => update({ q: event.target.value || null })}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="platform-organization-status"
              className="text-xs font-medium text-muted-foreground"
            >
              Statut
            </label>
            <Select
              value={status}
              onValueChange={(value) => update({ status: value ?? null })}
            >
              <SelectTrigger id="platform-organization-status" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_ALL}>Tous les statuts</SelectItem>
                {organizationStatusOptions.map((value) => (
                  <SelectItem key={value} value={value}>
                    {organizationStatusLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="platform-organization-sort"
              className="text-xs font-medium text-muted-foreground"
            >
              Tri
            </label>
            <Select
              value={sort}
              onValueChange={(value) => update({ sort: value ?? null })}
            >
              <SelectTrigger id="platform-organization-sort" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Création (récent)</SelectItem>
                <SelectItem value="updatedAt">Mise à jour (récent)</SelectItem>
                <SelectItem value="name">Nom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(status !== STATUS_ALL || query.trim() !== "") && (
            <Button
              variant="ghost"
              onClick={() => update({ status: null, q: null })}
            >
              Réinitialiser
            </Button>
          )}
        </div>
      </PlatformSection>

      <PlatformSection
        title="Résultats"
        description="L'état affiché est celui de l'organisation, pas celui d'un espace membre."
      >
        {organizations.isPending ? (
          <PageLoading />
        ) : organizations.isError || !organizations.data ? (
          <PlatformFailure
            error={organizations.error}
            retry={() => void organizations.refetch()}
          />
        ) : organizations.data.content.length === 0 ? (
          <EmptyState
            title="Aucune organisation"
            description="Aucune organisation ne correspond à ces critères."
          />
        ) : (
          <div className="space-y-4">
            <PlatformTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Devise</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créée le</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.data.content.map((organization) => (
                  <OrganizationRow
                    key={organization.id}
                    organization={organization}
                    session={session}
                    onAction={setPending}
                  />
                ))}
              </TableBody>
            </PlatformTable>
            <PlatformPagination
              page={organizations.data.page}
              totalElements={organizations.data.totalElements}
              totalPages={organizations.data.totalPages}
              onChange={goToPage}
              label="organisations"
            />
          </div>
        )}
      </PlatformSection>

      {target && pending && (
        <OrganizationActionDialog
          organization={target}
          action={pending.action}
          busy={action.isPending}
          error={action.error}
          onDismiss={() => {
            if (action.isPending) return;
            setPending(null);
            action.reset();
          }}
          onConfirm={(reason) =>
            action.mutate(
              { organizationId: target.id, action: pending.action, reason },
              {
                onSuccess: () => {
                  setPending(null);
                  action.reset();
                },
              },
            )
          }
        />
      )}
    </div>
  );
}

type PendingAction = { action: OrganizationAction; organizationId: string };

function OrganizationRow({
  organization,
  session,
  onAction,
}: {
  organization: PlatformOrganization;
  session: PlatformSession;
  onAction: (selection: PendingAction) => void;
}) {
  const capabilities = platformCapabilities(session);
  const available = organizationActions(organization, capabilities);
  return (
    <TableRow>
      <TableCell>
        <Link
          className="font-medium underline underline-offset-4"
          to={platformRoutes.organization(organization.id)}
        >
          {organization.name}
        </Link>
        <span className="block font-mono text-xs text-muted-foreground">
          {organization.id.slice(0, 8)}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {organization.currency}
      </TableCell>
      <TableCell>
        <StatusBadge
          label={organizationStatusLabels[organization.status]}
          tone={businessStatusTone[organization.status]}
        />
        {organization.suspensionReason && (
          <span className="mt-1 block max-w-64 truncate text-xs text-muted-foreground">
            {organization.suspensionReason}
          </span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatDateTime(organization.createdAt)}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-2">
          {available.map((value) => (
            <Button
              key={value}
              size="sm"
              variant={value === "suspend" ? "outline" : "default"}
              onClick={() =>
                onAction({ action: value, organizationId: organization.id })
              }
            >
              {organizationActionLabels[value]}
            </Button>
          ))}
        </div>
      </TableCell>
    </TableRow>
  );
}

function OrganizationActionDialog({
  organization,
  action,
  busy,
  error,
  onDismiss,
  onConfirm,
}: {
  organization: PlatformOrganization;
  action: OrganizationAction;
  busy: boolean;
  error: unknown;
  onDismiss: () => void;
  onConfirm: (reason: string) => void;
}) {
  const form = useForm<OrganizationActionForm>({
    resolver: zodResolver(organizationActionFormSchema),
    defaultValues: { reason: "" },
  });
  return (
    <Dialog open onOpenChange={(open) => !open && onDismiss()}>
      <FormDialogContent
        title={organizationActionLabels[action]}
        description={
          <>
            {organizationActionDescriptions[action]} Organisation «{" "}
            {organization.name} ». Le motif est conservé dans le journal
            d'audit.
          </>
        }
        onClose={onDismiss}
        showCloseButton={!busy}
      >
        <ValidatedForm
          form={form}
          submitLabel={organizationActionLabels[action]}
          disabled={busy}
          onSubmit={(values) => onConfirm(values.reason)}
        >
          <FormField
            name="reason"
            label="Motif"
            description="Entre 10 et 1 000 caractères, visible dans le journal d'audit."
          />
          {error !== null && error !== undefined && (
            <p role="alert" className="text-sm text-destructive">
              {toUserMessage(error)}
            </p>
          )}
          {error instanceof ApiError && error.status === 409 && (
            <p className="text-sm text-muted-foreground">
              Cette action a déjà été traitée : rechargez la liste pour voir son
              état actuel.
            </p>
          )}
        </ValidatedForm>
      </FormDialogContent>
    </Dialog>
  );
}
