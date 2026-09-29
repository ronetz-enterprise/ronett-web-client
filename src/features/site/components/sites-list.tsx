import { Link, useSearchParams } from "react-router";
import type { Membership } from "@/features/memberships";
import {
  EmptyState,
  PageHeader,
  PageLoading,
} from "@/shared/components/feedback";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
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
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/shared/ui/pagination";
import { ApiError } from "@/shared/errors/api-error";
import { useSites } from "../queries/sites";
import {
  siteCapabilities,
  siteRoutes,
  siteStatusLabels,
  siteStatusSchema,
} from "../model/site";
import { SiteFailure, SiteStatus } from "./site-shared";

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
      Créer un site
    </Button>
  ) : undefined;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sites"
        description={`Les emplacements de ${active.organizationName} où vous exploitez votre service Internet.`}
        actions={create}
      />
      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 basis-56 flex-1 space-y-2">
              <label htmlFor="site-search" className="text-sm font-medium">
                Rechercher un site
              </label>
              <Input
                id="site-search"
                value={search}
                placeholder="Nom, ville ou quartier"
                onChange={(event) => update("q", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="site-status"
                id="site-status-label"
                className="text-sm font-medium"
              >
                Statut
              </label>
              <Select
                value={filter}
                onValueChange={(value) => update("status", value ?? "ALL")}
              >
                <SelectTrigger
                  id="site-status"
                  aria-labelledby="site-status-label"
                >
                  <SelectValue>
                    {filter === "ALL"
                      ? "Tous les statuts"
                      : siteStatusLabels[filter]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
                  {Object.entries(siteStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              Actualiser
            </Button>
          </div>
          {query.isPending ? (
            <PageLoading />
          ) : query.isError ? (
            <SiteFailure
              error={query.error}
              retry={() => void query.refetch()}
            />
          ) : (
            <>
              <p role="status" className="text-sm text-muted-foreground">
                {filtered.length} résultat(s) sur {query.data.length} site(s).
                {query.isFetching && " Actualisation…"}
              </p>
              {!filtered.length ? (
                <EmptyState
                  title={query.data.length ? "Aucun résultat" : "Aucun site"}
                  description={
                    query.data.length
                      ? "Modifiez la recherche ou le statut sélectionné."
                      : "Créez votre premier site pour identifier un emplacement de votre organisation."
                  }
                  actions={
                    query.data.length ? (
                      <Button variant="outline" onClick={() => setParams({})}>
                        Effacer les filtres
                      </Button>
                    ) : (
                      create
                    )
                  }
                />
              ) : (
                <>
                  <div
                    className="console-table min-w-0 rounded-lg border"
                    data-density="standard"
                  >
                    <Table>
                      <TableCaption>
                        Sites de {active.organizationName}
                      </TableCaption>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Site</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="hidden md:table-cell">
                            Créé le
                          </TableHead>
                          <TableHead className="hidden lg:table-cell">
                            Modifié le
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered
                          .slice((page - 1) * size, page * size)
                          .map((site) => (
                            <TableRow key={site.id}>
                              <TableCell className="max-w-48 whitespace-normal">
                                <Link
                                  className="font-medium break-words underline underline-offset-4"
                                  to={siteRoutes.detail(
                                    active.organizationId,
                                    site.id,
                                  )}
                                >
                                  {site.name}
                                </Link>
                                <p className="mt-1 break-words text-xs text-muted-foreground">
                                  {[site.city, site.district]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              </TableCell>
                              <TableCell>
                                <SiteStatus site={site} />
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {new Date(site.createdAt).toLocaleDateString(
                                  "fr-FR",
                                )}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {new Date(site.updatedAt).toLocaleDateString(
                                  "fr-FR",
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="site-size"
                        id="site-size-label"
                        className="text-sm"
                      >
                        Par page
                      </label>
                      <Select
                        value={String(size)}
                        onValueChange={(value) => update("size", value ?? "10")}
                      >
                        <SelectTrigger
                          id="site-size"
                          aria-labelledby="site-size-label"
                        >
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
                    <Pagination
                      className="mx-0 w-auto"
                      aria-label="Pagination des sites"
                    >
                      <PaginationContent>
                        <PaginationItem>
                          <Button
                            variant="outline"
                            disabled={page <= 1}
                            onClick={() => update("page", String(page - 1))}
                          >
                            Précédent
                          </Button>
                        </PaginationItem>
                        <PaginationItem>
                          <span className="px-2 text-sm" aria-live="polite">
                            {page} / {pages}
                          </span>
                        </PaginationItem>
                        <PaginationItem>
                          <Button
                            variant="outline"
                            disabled={page >= pages}
                            onClick={() => update("page", String(page + 1))}
                          >
                            Suivant
                          </Button>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
