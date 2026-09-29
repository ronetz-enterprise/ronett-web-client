import { Link, useSearchParams } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Edit02Icon,
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu";
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
import { useSites } from "../queries/sites";
import {
  siteCapabilities,
  siteRoutes,
  siteStatusLabels,
  siteStatusSchema,
} from "../model/site";
import { SiteActions } from "./site-actions";
import { SiteFailure, SitePageHeader, SiteStatus } from "./site-shared";

export function SitesList({ active }: { active: Membership }) {
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
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value && value !== "ALL") next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: key !== "page" });
  }
  const create = caps.canCreateSite ? (
    <Button render={<Link to={siteRoutes.create(active.organizationId)} />}>
      <HugeiconsIcon
        icon={Add01Icon}
        strokeWidth={2}
        data-icon="inline-start"
      />
      Créer un site
    </Button>
  ) : undefined;
  return (
    <div className="space-y-5">
      <SitePageHeader
        title="Sites"
        description={`Les emplacements de ${active.organizationName} où vous exploitez votre service Internet.`}
        actions={
          <>
            <Button
              variant="ghost"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              <HugeiconsIcon
                icon={RefreshIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              Actualiser
            </Button>
            {create}
          </>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-72">
          <label htmlFor="site-search" className="sr-only">
            Rechercher un site par nom, ville ou quartier
          </label>
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="site-search"
            value={search}
            placeholder="Rechercher un site"
            className="rounded-full pr-3 pl-9"
            onChange={(event) => update("q", event.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                className="rounded-full"
                aria-label={
                  filter === "ALL"
                    ? "Ajouter un filtre par statut"
                    : `Filtrer par statut : ${siteStatusLabels[filter]}`
                }
              />
            }
          >
            <HugeiconsIcon
              icon={Add01Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            {filter === "ALL" ? "Ajouter un filtre" : siteStatusLabels[filter]}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Statut du site</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={filter}
              onValueChange={(value) => update("status", value ?? "ALL")}
            >
              <DropdownMenuRadioItem value="ALL">
                Tous les statuts
              </DropdownMenuRadioItem>
              {Object.entries(siteStatusLabels).map(([value, label]) => (
                <DropdownMenuRadioItem key={value} value={value}>
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <p role="status" className="text-sm text-muted-foreground">
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""} sur{" "}
          {query.data?.length ?? 0} site
          {(query.data?.length ?? 0) > 1 ? "s" : ""}
          {query.isFetching ? " · actualisation…" : ""}
        </p>
      </div>
      {query.isPending ? (
        <PageLoading />
      ) : query.isError ? (
        <SiteFailure error={query.error} retry={() => void query.refetch()} />
      ) : !filtered.length ? (
        <Empty className="border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" aria-hidden="true">
              <HugeiconsIcon icon={Location01Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle className="font-heading text-sm font-semibold">
              {query.data?.length ? "Aucun résultat" : "Aucun site"}
            </EmptyTitle>
            <EmptyDescription>
              {query.data?.length
                ? "Modifiez la recherche ou le statut sélectionné."
                : "Créez votre premier site pour identifier un emplacement de votre organisation."}
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
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table className="text-sm">
              <TableCaption className="sr-only">
                Sites de {active.organizationName}
              </TableCaption>
              <TableHeader className="bg-muted/60">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 pl-4 text-xs font-medium text-muted-foreground">
                    Site
                  </TableHead>
                  <TableHead className="h-9 text-xs font-medium text-muted-foreground">
                    Statut
                  </TableHead>
                  <TableHead className="h-9 hidden text-xs font-medium text-muted-foreground md:table-cell">
                    Créé le
                  </TableHead>
                  <TableHead className="h-9 hidden text-xs font-medium text-muted-foreground lg:table-cell">
                    Modifié le
                  </TableHead>
                  <TableHead className="h-9 pr-4 text-right text-xs font-medium text-muted-foreground">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice((page - 1) * size, page * size).map((site) => {
                  // L'edition se regle par site : un site ferme reste non modifiable.
                  const editable = siteCapabilities(active, site).canEditSite;
                  return (
                    <TableRow key={site.id}>
                      <TableCell className="max-w-64 py-2 pl-4 whitespace-normal">
                        <Link
                          className="font-medium break-words hover:underline hover:underline-offset-4"
                          to={siteRoutes.detail(active.organizationId, site.id)}
                        >
                          {site.name}
                        </Link>
                        <p className="mt-0.5 break-words text-xs text-muted-foreground">
                          {[site.city, site.district]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </TableCell>
                      <TableCell className="py-2">
                        <SiteStatus site={site} />
                      </TableCell>
                      <TableCell className="hidden py-2 text-muted-foreground md:table-cell">
                        {new Date(site.createdAt).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="hidden py-2 text-muted-foreground lg:table-cell">
                        {new Date(site.updatedAt).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="py-2 pr-4">
                        <div className="flex items-center justify-end gap-1">
                          {editable && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              nativeButton={false}
                              render={
                                <Link
                                  to={siteRoutes.settings(
                                    active.organizationId,
                                    site.id,
                                  )}
                                />
                              }
                            >
                              <HugeiconsIcon
                                icon={Edit02Icon}
                                strokeWidth={2}
                              />
                              <span className="sr-only">
                                Modifier {site.name}
                              </span>
                            </Button>
                          )}
                          <SiteActions active={active} site={site} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <label
                htmlFor="site-size"
                className="text-sm text-muted-foreground"
              >
                Par page
              </label>
              <Select
                value={String(size)}
                onValueChange={(value) => update("size", value ?? "10")}
              >
                <SelectTrigger id="site-size" className="h-8 w-16 rounded-full">
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
            <nav
              aria-label="Pagination des sites"
              className="flex items-center gap-2"
            >
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={page <= 1}
                onClick={() => update("page", String(page - 1))}
              >
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                Précédent
              </Button>
              <span
                className="px-1 text-sm text-muted-foreground"
                aria-live="polite"
              >
                {page} / {pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={page >= pages}
                onClick={() => update("page", String(page + 1))}
              >
                Suivant
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  data-icon="inline-end"
                />
              </Button>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
