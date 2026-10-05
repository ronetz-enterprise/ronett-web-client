import { type ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Location01Icon,
  RefreshIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import type { Membership } from "@/features/memberships";
import { PageLoading } from "@/shared/components/feedback";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  TableCaption,
} from "@/shared/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/ui/select";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/shared/ui/empty";
import { ApiError } from "@/shared/errors/api-error";
import { cn } from "@/shared/utils/cn";
import { formatDate } from "@/shared/utils/format";
import { initials, tintFor } from "@/shared/utils/tint";
import { useSites } from "../queries/sites";
import {
  siteCapabilities,
  siteRoutes,
  siteStatusLabels,
  siteStatusSchema,
  type Site,
} from "../model/site";
import { SiteFailure, SitePageHeader, SiteStatus } from "./site-shared";

const statusFilters = [
  ["ALL", "Tous"],
  ...Object.entries(siteStatusLabels),
] as const;

export function SitesList({
  active,
  renderRouters,
}: {
  active: Membership;
  /** Cellule « Routeurs » d'un site (en ligne / déclarés), composée par la page. */
  renderRouters?: (site: Site) => ReactNode;
}) {
  const query = useSites(active);
  const [params, setParams] = useSearchParams();
  const caps = siteCapabilities(active);
  if (!caps.canViewSites)
    return <SiteFailure error={new ApiError("http", 403)} />;
  const search = params.get("q") ?? "";
  const status = siteStatusSchema.safeParse(params.get("status"));
  const filter = status.success ? status.data : "ALL";
  const size = [10, 25, 50].includes(Number(params.get("size")))
    ? Number(params.get("size"))
    : 10;
  const requestedPage = Number(params.get("page") ?? 1);
  const filtered = (query.data ?? []).filter(
    (site) =>
      (filter === "ALL" || site.status === filter) &&
      [site.name, site.city, site.district ?? ""].some((value) =>
        value
          .toLocaleLowerCase("fr")
          .includes(search.trim().toLocaleLowerCase("fr")),
      ),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, pages)
      : 1;
  const all = query.data ?? [];
  const countFor = (value: string) =>
    value === "ALL"
      ? all.length
      : all.filter((site) => site.status === value).length;
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value && value !== "ALL") next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: key !== "page" });
  }
  const create = caps.canCreateSite ? (
    <Button
      nativeButton={false}
      role="link"
      render={<Link to={siteRoutes.create()} />}
    >
      <HugeiconsIcon
        icon={Add01Icon}
        strokeWidth={1.75}
        data-icon="inline-start"
      />
      Créer un site
    </Button>
  ) : undefined;
  return (
    <>
      <SitePageHeader
        title="Sites"
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
      {/* Collé sous l'en-tête et aux bords, comme Routeurs et Accès : blocs séparés par des traits. */}
      <div className="page-bleed -mt-6">
        <div className="flex flex-wrap items-center gap-3 border-b px-(--page-gutter) py-3">
          <div
            role="group"
            aria-label="Filtrer par statut"
            className="inline-flex flex-wrap gap-1"
          >
            {statusFilters.map(([value, label]) => {
              const selected = filter === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => update("status", value)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors",
                    selected
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-xs tabular-nums",
                      selected
                        ? "bg-background text-foreground ring-1 ring-border"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {countFor(value)}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative min-w-0 flex-1 sm:ml-auto sm:max-w-72 sm:flex-none">
            <label htmlFor="site-search" className="sr-only">
              Rechercher un site par nom, ville ou quartier
            </label>
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={1.75}
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="site-search"
              type="search"
              value={search}
              placeholder="Nom, ville ou quartier"
              className="h-9 w-full pr-3 pl-9"
              onChange={(event) => update("q", event.target.value)}
            />
          </div>
          <p role="status" className="sr-only">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""} sur{" "}
            {all.length} site{all.length > 1 ? "s" : ""}
            {query.isFetching ? " · actualisation…" : ""}
          </p>
        </div>
        {query.isPending ? (
          <div className="border-b px-(--page-gutter) py-6">
            <PageLoading />
          </div>
        ) : query.isError ? (
          <div className="border-b px-(--page-gutter) py-6">
            <SiteFailure
              error={query.error}
              retry={() => void query.refetch()}
            />
          </div>
        ) : !filtered.length ? (
          <Empty className="border-b py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon" aria-hidden="true">
                <HugeiconsIcon icon={Location01Icon} strokeWidth={1.75} />
              </EmptyMedia>
              <EmptyTitle className="font-heading text-sm font-semibold">
                {query.data?.length ? "Aucun résultat" : "Aucun site"}
              </EmptyTitle>
              <EmptyDescription>
                {query.data?.length
                  ? "Modifiez la recherche ou le statut sélectionné."
                  : "Créez votre premier site : c’est le lieu où votre WiFi est proposé."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {query.data?.length ? (
                <Button variant="outline" onClick={() => setParams({})}>
                  Effacer les filtres
                </Button>
              ) : (
                create
              )}
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <div className="border-b [&_[data-slot=table-container]]:scrollbar-none">
              <Table>
                <TableCaption className="sr-only">
                  Sites de {active.organizationName}
                </TableCaption>
                <TableHeader className="bg-muted/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9 text-xs font-medium text-muted-foreground">
                      Site
                    </TableHead>
                    <TableHead className="hidden h-9 text-xs font-medium text-muted-foreground sm:table-cell">
                      Lieu
                    </TableHead>
                    <TableHead className="h-9 text-xs font-medium text-muted-foreground">
                      Statut
                    </TableHead>
                    {renderRouters && (
                      <TableHead className="hidden h-9 text-xs font-medium text-muted-foreground md:table-cell">
                        Routeurs
                      </TableHead>
                    )}
                    <TableHead className="hidden h-9 text-xs font-medium text-muted-foreground lg:table-cell">
                      Créé le
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered
                    .slice((page - 1) * size, page * size)
                    .map((site) => (
                      <TableRow key={site.id}>
                        <TableCell className="h-(--table-row-compact) py-1.5">
                          <div className="flex items-center gap-2.5">
                            <span
                              aria-hidden="true"
                              className={cn(
                                "flex size-7 shrink-0 items-center justify-center rounded-md text-[0.6875rem] font-semibold",
                                tintFor(site.id),
                                site.status === "CLOSED" && "opacity-50",
                              )}
                            >
                              {initials(site.name)}
                            </span>
                            <Link
                              className="font-medium break-words hover:underline hover:underline-offset-4"
                              to={siteRoutes.detail(
                                active.organizationId,
                                site.id,
                              )}
                            >
                              {site.name}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell className="hidden py-1.5 text-muted-foreground sm:table-cell">
                          {[site.city, site.district]
                            .filter(Boolean)
                            .join(" · ")}
                        </TableCell>
                        <TableCell className="py-1.5">
                          <SiteStatus site={site} />
                        </TableCell>
                        {renderRouters && (
                          <TableCell className="hidden py-1.5 md:table-cell">
                            {renderRouters(site)}
                          </TableCell>
                        )}
                        <TableCell className="hidden py-1.5 text-muted-foreground tabular-nums lg:table-cell">
                          {formatDate(site.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-(--page-gutter) py-2.5 text-sm text-muted-foreground">
              <p>
                Total : {filtered.length} site{filtered.length > 1 ? "s" : ""}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="site-size">Par page</label>
                  <Select
                    value={String(size)}
                    onValueChange={(value) => update("size", value ?? "10")}
                  >
                    <SelectTrigger id="site-size" className="h-7 w-18">
                      <SelectValue>{size}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 25, 50].map((value) => (
                        <SelectItem key={value} value={String(value)}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {pages > 1 && (
                  <nav
                    aria-label="Pagination des sites"
                    className="flex items-center gap-1"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => update("page", String(page - 1))}
                    >
                      Précédent
                    </Button>
                    <span className="px-2 tabular-nums" aria-live="polite">
                      {page} / {pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pages}
                      onClick={() => update("page", String(page + 1))}
                    >
                      Suivant
                    </Button>
                  </nav>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
