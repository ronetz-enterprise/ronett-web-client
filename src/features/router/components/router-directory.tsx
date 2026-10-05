import { useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowDown01Icon,
  FilterHorizontalIcon,
  LeftToRightListBulletIcon,
  RefreshIcon,
  SortingAZ01Icon,
} from "@hugeicons/core-free-icons";
import type { Membership } from "@/features/memberships";
import { useSites, siteRoutes, type Site } from "@/features/site";
import {
  EmptyState,
  PageHeader,
  PageLoading,
} from "@/shared/components/feedback";
import { DataToolbar } from "@/shared/components/data-toolbar";
import { ApiError } from "@/shared/errors/api-error";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { cn } from "@/shared/utils/cn";
import { formatDateTime } from "@/shared/utils/format";
import { useRouterList } from "../queries/routers";
import {
  connectivityLabels,
  routerCapabilities,
  routerRoutes,
  type Router,
} from "../model/router";
import {
  RouterConnectivity,
  RouterFailure,
  RouterStatus,
} from "./router-shared";

/**
 * Le backend pagine les routeurs par date d'ajout, sans filtre ni autre tri : une recherche,
 * un filtre ou un autre tri charge la plus grande page autorisée et s'applique dans le
 * navigateur, en le signalant au-delà de cette limite.
 */
export const ROUTER_SCAN_SIZE = 100;
const connectivityValues = Object.keys(connectivityLabels) as Array<
  Router["connectivityStatus"]
>;

export const sortLabels = {
  created: "date d’ajout",
  name: "nom",
  site: "site",
  seen: "dernier signal",
} as const;
export type RouterSort = keyof typeof sortLabels;

/** Recherche sur le nom, le constructeur et le modèle. */
export function matchesSearch(router: Router, search: string) {
  const needle = search.trim().toLocaleLowerCase("fr");
  return (
    !needle ||
    [router.name, router.vendor, router.model].some((value) =>
      value.toLocaleLowerCase("fr").includes(needle),
    )
  );
}

/** Tri d'affichage ; « date d'ajout » conserve l'ordre du backend. */
export function sortRouters(
  routers: Router[],
  sort: RouterSort,
  siteName: (router: Router) => string,
) {
  if (sort === "created") return routers;
  const text = (a: string, b: string) => a.localeCompare(b, "fr");
  return [...routers].sort((a, b) =>
    sort === "name"
      ? text(a.name, b.name)
      : sort === "site"
        ? text(siteName(a), siteName(b)) || text(a.name, b.name)
        : // Dernier signal : le plus récent d'abord, jamais vus à la fin.
          (b.lastSeenAt ?? "").localeCompare(a.lastSeenAt ?? ""),
  );
}

type Column = {
  key: string;
  label: string;
  /** Largeur minimale de la colonne, en rem. */
  width: number;
  optional?: boolean;
  render: (router: Router) => ReactNode;
};

const COLUMNS_KEY = "ronetz.router-columns";
const defaultHidden = ["vendor", "lifecycle"];

function readHidden(): string[] {
  if (typeof window === "undefined") return defaultHidden;
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(COLUMNS_KEY) ?? "null",
    );
    return Array.isArray(value) &&
      value.every((item) => typeof item === "string")
      ? value
      : defaultHidden;
  } catch {
    return defaultHidden;
  }
}

/** Liste des routeurs en grille de données (modèle Users de Supabase). */
export function RouterList({ active }: { active: Membership }) {
  const [params, setParams] = useSearchParams();
  const [hidden, setHidden] = useState<string[]>(readHidden);
  const rawPage = Number(params.get("page") ?? 0),
    rawSize = Number(params.get("size") ?? 20);
  const search = params.get("q") ?? "";
  const sort: RouterSort =
    (Object.keys(sortLabels) as RouterSort[]).find(
      (key) => key === params.get("sort"),
    ) ?? "created";
  const siteFilter = params.get("site") ?? "";
  const connectivity = connectivityValues.find(
    (v) => v === params.get("connectivity"),
  );
  const filtering = !!(search.trim() || siteFilter || connectivity);
  const scanning = filtering || sort !== "created";
  const page =
    Number.isSafeInteger(rawPage) && rawPage >= 0 && rawPage <= 2147483647
      ? rawPage
      : 0;
  const size = [10, 20, 50, 100].includes(rawSize) ? rawSize : 20;
  const query = useRouterList(
    active,
    scanning ? 0 : page,
    scanning ? ROUTER_SCAN_SIZE : size,
  );
  const sites = useSites(active);
  const caps = routerCapabilities(active);
  // Sans site, l'étape suivante du parcours est d'en créer un, pas un routeur.
  const noSite = sites.data?.length === 0;
  if (!caps.canViewRouters)
    return <RouterFailure error={new ApiError("http", 403)} />;
  function update(values: Record<string, string | number | undefined>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    if (!("page" in values)) next.delete("page");
    setParams(next, { replace: !("page" in values) });
  }
  function toggleColumn(key: string, visible: boolean) {
    const next = visible
      ? hidden.filter((item) => item !== key)
      : [...hidden, key];
    setHidden(next);
    try {
      localStorage.setItem(COLUMNS_KEY, JSON.stringify(next));
    } catch {
      /* Préférence d'affichage : perdue au rechargement, sans gravité. */
    }
  }
  const siteOf = (router: Router) =>
    sites.data?.find((s) => s.id === router.siteId);
  const routers = sortRouters(
    (query.data?.content ?? []).filter(
      (router) =>
        (!siteFilter || router.siteId === siteFilter) &&
        (!connectivity || router.connectivityStatus === connectivity) &&
        matchesSearch(router, search),
    ),
    sort,
    (router) => siteOf(router)?.name ?? "",
  );
  const siteName = sites.data?.find((s) => s.id === siteFilter)?.name;
  const activeFilters = [
    siteFilter && {
      key: "site",
      label: `Site : ${siteName ?? "inconnu"}`,
      onRemove: () => update({ site: undefined }),
    },
    connectivity && {
      key: "connectivity",
      label: `Connexion : ${connectivityLabels[connectivity]}`,
      onRemove: () => update({ connectivity: undefined }),
    },
  ].filter((value) => !!value);
  const columns: Column[] = [
    {
      key: "name",
      label: "Nom",
      width: 12,
      render: (router) => (
        <Link
          className="font-medium hover:underline hover:underline-offset-4"
          to={routerRoutes.detail(
            active.organizationId,
            router.id,
            router.siteId ?? undefined,
          )}
        >
          {router.name}
        </Link>
      ),
    },
    {
      key: "id",
      label: "Identifiant",
      width: 20,
      optional: true,
      render: (router) => (
        <span className="font-mono text-xs text-muted-foreground">
          {router.id}
        </span>
      ),
    },
    {
      key: "site",
      label: "Site",
      width: 11,
      optional: true,
      render: (router) => <SiteCell router={router} site={siteOf(router)} />,
    },
    {
      key: "vendor",
      label: "Constructeur",
      width: 8,
      optional: true,
      render: (router) => router.vendor,
    },
    {
      key: "model",
      label: "Modèle",
      width: 9,
      optional: true,
      render: (router) => router.model,
    },
    {
      key: "connectivity",
      label: "Connexion",
      width: 8,
      optional: true,
      render: (router) => <RouterConnectivity router={router} />,
    },
    {
      key: "provisioning",
      label: "Installation",
      width: 9,
      optional: true,
      render: (router) => (
        <RouterStatus router={router} dimension="provisioning" />
      ),
    },
    {
      key: "lifecycle",
      label: "Cycle de vie",
      width: 8,
      optional: true,
      render: (router) => (
        <RouterStatus router={router} dimension="lifecycle" />
      ),
    },
    {
      key: "seen",
      label: "Dernier signal",
      width: 10,
      optional: true,
      render: (router) =>
        router.lastSeenAt ? (
          formatDateTime(router.lastSeenAt)
        ) : (
          <span className="text-muted-foreground">Jamais</span>
        ),
    },
    {
      key: "created",
      label: "Ajouté le",
      width: 10,
      optional: true,
      render: (router) => formatDateTime(router.createdAt),
    },
  ];
  const visibleColumns = columns.filter(
    (column) => !column.optional || !hidden.includes(column.key),
  );
  const create = caps.canCreateRouter ? (
    <Button
      nativeButton={false}
      role="link"
      render={<Link to={routerRoutes.create(active.organizationId)} />}
    >
      <HugeiconsIcon
        icon={Add01Icon}
        strokeWidth={1.75}
        data-icon="inline-start"
      />
      Ajouter un routeur
    </Button>
  ) : undefined;
  const total = query.data?.totalElements ?? 0;
  return (
    <div className="space-y-4">
      <PageHeader
        title="Routeurs"
        actions={
          <>
            <Button
              variant="ghost"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              <HugeiconsIcon
                icon={RefreshIcon}
                strokeWidth={1.75}
                data-icon="inline-start"
              />
              Actualiser
            </Button>
            {create}
          </>
        }
      />
      <DataToolbar
        search={search}
        onSearch={(value) => update({ q: value })}
        searchLabel="Rechercher un routeur"
        active={activeFilters}
        onClear={() =>
          update({ q: undefined, site: undefined, connectivity: undefined })
        }
        count={query.data ? routers.length : undefined}
        countLabel="routeur"
        filters={
          <Popover>
            <PopoverTrigger
              render={<Button variant="outline" size="sm" className="h-8" />}
            >
              <HugeiconsIcon
                icon={FilterHorizontalIcon}
                strokeWidth={1.75}
                data-icon="inline-start"
              />
              Filtre
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 space-y-4">
              <FilterSelect
                id="router-site-filter"
                label="Site"
                value={siteFilter || "ALL"}
                display={
                  siteFilter ? (siteName ?? "Site inconnu") : "Tous les sites"
                }
                options={[
                  { value: "ALL", label: "Tous les sites" },
                  ...(sites.data ?? []).map((site) => ({
                    value: site.id,
                    label: site.name,
                  })),
                ]}
                onChange={(value) =>
                  update({ site: value === "ALL" ? undefined : value })
                }
              />
              <FilterSelect
                id="router-connectivity-filter"
                label="Connexion"
                value={connectivity ?? "ALL"}
                display={
                  connectivity
                    ? connectivityLabels[connectivity]
                    : "Toutes les connexions"
                }
                options={[
                  { value: "ALL", label: "Toutes les connexions" },
                  ...connectivityValues.map((value) => ({
                    value,
                    label: connectivityLabels[value],
                  })),
                ]}
                onChange={(value) =>
                  update({ connectivity: value === "ALL" ? undefined : value })
                }
              />
            </PopoverContent>
          </Popover>
        }
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="sm" className="h-8" />}
              >
                <HugeiconsIcon
                  icon={LeftToRightListBulletIcon}
                  strokeWidth={1.75}
                  data-icon="inline-start"
                />
                {visibleColumns.length === columns.length
                  ? "Toutes les colonnes"
                  : `${visibleColumns.length} colonnes sur ${columns.length}`}
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  strokeWidth={1.75}
                  data-icon="inline-end"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Colonnes affichées</DropdownMenuLabel>
                  {columns
                    .filter((column) => column.optional)
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.key}
                        checked={!hidden.includes(column.key)}
                        onCheckedChange={(checked) =>
                          toggleColumn(column.key, checked)
                        }
                      >
                        {column.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="sm" className="h-8" />}
              >
                <HugeiconsIcon
                  icon={SortingAZ01Icon}
                  strokeWidth={1.75}
                  data-icon="inline-start"
                />
                Trié par {sortLabels[sort]}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Trier par</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={sort}
                    onValueChange={(value) =>
                      update({
                        sort: value === "created" ? undefined : String(value),
                      })
                    }
                  >
                    {(Object.keys(sortLabels) as RouterSort[]).map((key) => (
                      <DropdownMenuRadioItem key={key} value={key}>
                        {sortLabels[key].charAt(0).toLocaleUpperCase("fr") +
                          sortLabels[key].slice(1)}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />
      {scanning && total > ROUTER_SCAN_SIZE && (
        <p className="text-sm text-muted-foreground">
          La recherche, le filtre et le tri portent sur les {ROUTER_SCAN_SIZE}{" "}
          premiers routeurs de l’organisation sur {total}.
        </p>
      )}
      {sites.isError && (
        <RouterFailure error={sites.error} retry={() => void sites.refetch()} />
      )}
      {query.isPending ? (
        <PageLoading />
      ) : query.isError ? (
        <RouterFailure error={query.error} retry={() => void query.refetch()} />
      ) : !routers.length ? (
        filtering ? (
          <EmptyState
            objectType="router"
            variant="filtered"
            title="Aucun routeur ne correspond"
            description="Modifiez la recherche ou retirez un filtre."
            actions={
              <Button variant="outline" onClick={() => setParams({})}>
                Effacer les filtres
              </Button>
            }
          />
        ) : (
          <EmptyState
            objectType="router"
            variant={noSite ? "prerequisite" : "empty"}
            title={
              total
                ? "Cette page ne contient plus de routeurs"
                : noSite
                  ? "Créez d’abord un site"
                  : "Aucun routeur"
            }
            description={
              total
                ? "Revenez à la première page."
                : noSite
                  ? "Un routeur est toujours rattaché à un site : le lieu où votre WiFi est proposé."
                  : "Déclarez un équipement et rattachez-le à un site actif."
            }
            actions={
              noSite && !total ? (
                <Button
                  nativeButton={false}
                  role="link"
                  render={<Link to={siteRoutes.create()} />}
                >
                  Créer un site
                </Button>
              ) : page > 0 ? (
                <Button variant="outline" onClick={() => update({ page: 0 })}>
                  Première page
                </Button>
              ) : (
                create
              )
            }
          />
        )
      ) : (
        <div className="page-bleed">
          {/* Barre de défilement masquée ; la zone focalisable se fait défiler au clavier. */}
          <div
            // Zone défilable : focalisable pour défiler au clavier (axe scrollable-region-focusable).
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            role="region"
            aria-label="Tableau des routeurs, défilable horizontalement"
            className="scrollbar-none overflow-x-auto border-y focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
          >
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">
                Routeurs de {active.organizationName}
              </caption>
              <thead>
                <tr>
                  {visibleColumns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      style={{ minWidth: `${column.width}rem` }}
                      className="h-10 border-r border-b bg-muted/60 px-3 text-left text-xs font-medium whitespace-nowrap text-muted-foreground last:border-r-0"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {routers.map((router) => (
                  <tr
                    key={router.id}
                    className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-muted/40"
                  >
                    {visibleColumns.map((column) => (
                      <td
                        key={column.key}
                        className="h-(--table-row-standard) border-r border-border/70 px-3 whitespace-nowrap last:border-r-0"
                      >
                        {column.render(router)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-(--page-gutter) py-2.5 text-sm text-muted-foreground">
            <p role="status">
              Total : {scanning ? routers.length : total} routeur
              {(scanning ? routers.length : total) > 1 ? "s" : ""}
              {scanning && routers.length !== total && ` sur ${total}`}
            </p>
            {!scanning && (
              <Pager
                page={page}
                size={size}
                total={total}
                busy={query.isFetching}
                onPage={(value) => update({ page: value })}
                onSize={(value) => update({ size: value })}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SiteCell({ router, site }: { router: Router; site?: Site }) {
  if (site)
    return (
      <Link
        className="hover:underline hover:underline-offset-4"
        to={siteRoutes.detail(router.organizationId, site.id)}
      >
        {site.name}
      </Link>
    );
  return (
    <span className="text-muted-foreground">
      {router.siteId ? "Site non chargé" : "Sans site"}
    </span>
  );
}

function FilterSelect({
  id,
  label,
  value,
  display,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  display: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p id={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <Select
        value={value}
        onValueChange={(next) => onChange(next ? String(next) : "ALL")}
      >
        <SelectTrigger aria-labelledby={id} className="w-full">
          <SelectValue>{display}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Pager({
  page,
  size,
  total,
  busy,
  onPage,
  onSize,
}: {
  page: number;
  size: number;
  total: number;
  busy: boolean;
  onPage: (page: number) => void;
  onSize: (size: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <nav
      aria-label="Pagination des routeurs"
      className="flex flex-wrap items-center gap-3"
    >
      <div className="flex items-center gap-2">
        <label id="router-size-label" htmlFor="router-size">
          Par page
        </label>
        <Select
          value={String(size)}
          onValueChange={(value) => onSize(Number(value ?? 20))}
        >
          <SelectTrigger
            id="router-size"
            aria-labelledby="router-size-label"
            className="h-7"
          >
            <SelectValue>{size}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50, 100].map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="xs"
          disabled={page === 0 || busy}
          onClick={() => onPage(page - 1)}
        >
          Précédent
        </Button>
        <span className={cn("px-1.5 tabular-nums")}>
          {page + 1} / {pages}
        </span>
        <Button
          variant="outline"
          size="xs"
          disabled={(page + 1) * size >= total || busy}
          onClick={() => onPage(page + 1)}
        >
          Suivant
        </Button>
      </div>
    </nav>
  );
}
