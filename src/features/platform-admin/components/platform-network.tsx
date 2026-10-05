import { useSearchParams } from "react-router";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { EmptyState, PageLoading } from "@/shared/components/feedback";
import { businessStatusTone } from "@/shared/components/status";
import { formatDateTime } from "../formatters/platform";
import {
  connectivityLabels,
  connectivityTones,
  organizationStatusLabels,
  organizationStatusOptions,
  platformCapabilities,
  platformLabel,
  provisioningLabels,
  routerLifecycleLabels,
  type PlatformSession,
} from "../model/platform";
import {
  usePlatformRouters,
  usePlatformSites,
  type NetworkFilters,
} from "../queries/platform";
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

const ALL = "ALL";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Resource = "sites" | "routers";

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
 * Console réseau : sites et routeurs de toutes les organisations.
 *
 * Les filtres transmis au backend sont ceux qu'il sait appliquer, notamment le
 * statut et la connectivité déclarée. L'identifiant d'organisation se saisit ou
 * se parcourt depuis la fiche d'une organisation.
 */
export function PlatformNetwork({ session }: { session: PlatformSession }) {
  const capabilities = platformCapabilities(session);
  const [params, setParams] = useSearchParams();

  const resource: Resource =
    params.get("resource") === "routers" ? "routers" : "sites";
  const page = readPage(params.get("page"));
  const organizationId = UUID.test(params.get("organisation") ?? "")
    ? params.get("organisation")
    : null;
  const query = params.get("q") ?? "";
  const status = readChoice(
    params.get("status"),
    [ALL, ...organizationStatusOptions],
    ALL,
  );
  const lifecycleStatus = readChoice(
    params.get("lifecycle"),
    [ALL, "ACTIVE", "SUSPENDED", "CLOSED"],
    ALL,
  );
  const connectivityStatus = readChoice(
    params.get("connectivite"),
    [ALL, "ONLINE", "OFFLINE", "UNKNOWN"],
    ALL,
  );

  const siteFilters = { organizationId, status, query, sort: "name" };
  const routerFilters: NetworkFilters = {
    organizationId,
    siteId: UUID.test(params.get("site") ?? "") ? params.get("site") : null,
    lifecycleStatus,
    connectivityStatus,
    query,
    sort: "name",
  };
  const sites = usePlatformSites(
    capabilities.canReadNetwork ? session : undefined,
    siteFilters,
    resource === "sites" ? page : 0,
    PLATFORM_PAGE_SIZE,
  );
  const routers = usePlatformRouters(
    capabilities.canReadNetwork ? session : undefined,
    routerFilters,
    resource === "routers" ? page : 0,
    PLATFORM_PAGE_SIZE,
  );

  function update(next: Record<string, string | null>) {
    const search = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value) search.set(key, value);
      else search.delete(key);
    }
    // Changer de ressource ou de filtre repart de la première page.
    search.delete("page");
    setParams(search, { replace: true, preventScrollReset: true });
  }

  function goToPage(next: number) {
    const search = new URLSearchParams(params);
    search.set("page", String(next));
    setParams(search, { preventScrollReset: true });
  }

  if (!capabilities.canReadNetwork)
    return (
      <div className="space-y-6">
        <PlatformPageHeader
          title="Réseau"
          description="Sites et routeurs de la plateforme."
        />
        <PlatformForbidden area="La console réseau" />
      </div>
    );

  const filtering =
    organizationId !== null ||
    query.trim() !== "" ||
    (resource === "sites"
      ? status !== ALL
      : lifecycleStatus !== ALL || connectivityStatus !== ALL);

  return (
    <div className="space-y-8">
      <PlatformPageHeader
        title="Réseau"
        description="Sites et routeurs toutes organisations confondues."
      />

      <Tabs
        value={resource}
        onValueChange={(value) => update({ resource: value })}
      >
        <TabsList>
          <TabsTrigger value="sites">Sites</TabsTrigger>
          <TabsTrigger value="routers">Routeurs</TabsTrigger>
        </TabsList>
      </Tabs>

      <PlatformSection
        title="Filtres"
        description="Transmis à la plateforme ; un filtre non supporté n'est jamais annoncé."
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-56 flex-1 flex-col gap-1.5">
            <label
              htmlFor="platform-network-query"
              className="text-xs font-medium text-muted-foreground"
            >
              Nom
            </label>
            <Input
              id="platform-network-query"
              value={query}
              placeholder="Rechercher par nom"
              onChange={(event) => update({ q: event.target.value || null })}
            />
          </div>
          <div className="flex min-w-64 flex-col gap-1.5">
            <label
              htmlFor="platform-network-organization"
              className="text-xs font-medium text-muted-foreground"
            >
              Identifiant d'organisation
            </label>
            <Input
              id="platform-network-organization"
              value={params.get("organisation") ?? ""}
              placeholder="UUID, ou lien depuis une fiche organisation"
              onChange={(event) =>
                update({ organisation: event.target.value || null })
              }
            />
          </div>
          {resource === "sites" ? (
            <FilterSelect
              id="platform-network-status"
              label="Statut"
              value={status}
              options={[ALL, ...organizationStatusOptions]}
              labels={{
                [ALL]: "Tous les statuts",
                ...organizationStatusLabels,
              }}
              onChange={(value) => update({ status: value ?? null })}
            />
          ) : (
            <>
              <FilterSelect
                id="platform-network-lifecycle"
                label="Cycle de vie"
                value={lifecycleStatus}
                options={[ALL, "ACTIVE", "SUSPENDED", "CLOSED"]}
                labels={{
                  [ALL]: "Tous",
                  ...routerLifecycleLabels,
                }}
                onChange={(value) => update({ lifecycle: value ?? null })}
              />
              <FilterSelect
                id="platform-network-connectivity"
                label="Connectivité"
                value={connectivityStatus}
                options={[ALL, "ONLINE", "OFFLINE", "UNKNOWN"]}
                labels={{ [ALL]: "Toutes", ...connectivityLabels }}
                onChange={(value) => update({ connectivite: value ?? null })}
              />
            </>
          )}
          {filtering && (
            <Button
              variant="ghost"
              onClick={() =>
                update({
                  q: null,
                  organisation: null,
                  status: null,
                  lifecycle: null,
                  connectivite: null,
                })
              }
            >
              Réinitialiser
            </Button>
          )}
        </div>
      </PlatformSection>

      {resource === "sites" ? (
        <PlatformSection
          title="Sites"
          description="Sites rattachés à toutes les organisations."
        >
          {sites.isPending ? (
            <PageLoading />
          ) : sites.isError || !sites.data ? (
            <PlatformFailure
              error={sites.error}
              retry={() => void sites.refetch()}
            />
          ) : sites.data.content.length === 0 ? (
            <EmptyState
              title="Aucun site"
              description="Aucun site ne correspond à ces critères."
            />
          ) : (
            <div className="space-y-4">
              <PlatformTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Créé le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sites.data.content.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell className="font-medium">{site.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {site.city}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {site.organizationId.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={organizationStatusLabels[site.status]}
                          tone={businessStatusTone[site.status]}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(site.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </PlatformTable>
              <PlatformPagination
                page={sites.data.page}
                totalElements={sites.data.totalElements}
                totalPages={sites.data.totalPages}
                onChange={goToPage}
                label="sites"
              />
            </div>
          )}
        </PlatformSection>
      ) : (
        <PlatformSection
          title="Routeurs"
          description="Connectivité déclarée par chaque routeur, tous cycles de vie confondus."
        >
          {routers.isPending ? (
            <PageLoading />
          ) : routers.isError || !routers.data ? (
            <PlatformFailure
              error={routers.error}
              retry={() => void routers.refetch()}
            />
          ) : routers.data.content.length === 0 ? (
            <EmptyState
              title="Aucun routeur"
              description="Aucun routeur ne correspond à ces critères."
            />
          ) : (
            <div className="space-y-4">
              <PlatformTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Routeur</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Connectivité</TableHead>
                    <TableHead>Cycle de vie</TableHead>
                    <TableHead>Provisionnement</TableHead>
                    <TableHead>Vu la dernière fois</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routers.data.content.map((router) => (
                    <TableRow key={router.id}>
                      <TableCell>
                        <span className="font-medium">{router.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {[router.vendor, router.model]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {router.siteId ? router.siteId.slice(0, 8) : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={connectivityLabels[router.connectivityStatus]}
                          tone={connectivityTones[router.connectivityStatus]}
                        />
                        {router.failureCode && (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {router.failureCode}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {platformLabel(
                          routerLifecycleLabels,
                          router.lifecycleStatus,
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {platformLabel(
                          provisioningLabels,
                          router.provisioningStatus,
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(router.lastSeenAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </PlatformTable>
              <PlatformPagination
                page={routers.data.page}
                totalElements={routers.data.totalElements}
                totalPages={routers.data.totalPages}
                onChange={goToPage}
                label="routeurs"
              />
            </div>
          )}
        </PlatformSection>
      )}
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  options,
  labels,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  labels: Record<string, string>;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {labels[option] ?? option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
