import { Link, useSearchParams } from "react-router";
import type { Membership } from "@/features/memberships";
import { useSites, siteRoutes } from "@/features/site";
import {
  EmptyState,
  PageHeader,
  PageLoading,
} from "@/shared/components/feedback";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableCaption,
} from "@/shared/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/shared/ui/pagination";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/ui/select";
import { ApiError } from "@/shared/errors/api-error";
import { useRouterList } from "../queries/routers";
import { routerRoutes, routerCapabilities } from "../model/router";
import { RouterStatus, LastObservation, RouterFailure } from "./router-shared";

export function RouterList({ active }: { active: Membership }) {
  const [params, setParams] = useSearchParams();
  const rawPage = Number(params.get("page") ?? 0),
    rawSize = Number(params.get("size") ?? 20);
  const page =
    Number.isSafeInteger(rawPage) && rawPage >= 0 && rawPage <= 2147483647
      ? rawPage
      : 0;
  const size = [10, 20, 50, 100].includes(rawSize) ? rawSize : 20;
  const query = useRouterList(active, page, size),
    sites = useSites(active);
  const caps = routerCapabilities(active);
  if (!caps.canViewRouters)
    return <RouterFailure error={new ApiError("http", 403)} />;
  function change(key: string, value: number) {
    const next = new URLSearchParams(params);
    next.set(key, String(value));
    if (key !== "page") next.set("page", "0");
    setParams(next);
  }
  const create = caps.canCreateRouter ? (
    <Button render={<Link to={routerRoutes.create(active.organizationId)} />}>
      Déclarer un routeur
    </Button>
  ) : undefined;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Routeurs"
        description={`Équipements réseau de ${active.organizationName}. Le cycle de vie, le provisioning et la connectivité sont présentés séparément.`}
        actions={create}
      />
      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-prose text-sm text-muted-foreground">
              La recherche et les filtres par site ou état ne sont pas encore
              disponibles. Cette liste est paginée par le serveur.
            </p>
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
            <RouterFailure
              error={query.error}
              retry={() => void query.refetch()}
            />
          ) : (
            <>
              <p role="status" className="text-sm text-muted-foreground">
                {query.data.totalElements} routeur(s).
                {query.isFetching && " Actualisation…"}
              </p>
              {sites.isError && (
                <RouterFailure
                  error={sites.error}
                  retry={() => void sites.refetch()}
                />
              )}
              {!query.data.content.length ? (
                <EmptyState
                  title={
                    query.data.totalElements
                      ? "Cette page ne contient plus de routeurs"
                      : "Aucun routeur"
                  }
                  description={
                    query.data.totalElements
                      ? "Revenez à la première page."
                      : "Déclarez un équipement et rattachez-le à un site actif."
                  }
                  actions={
                    page > 0 ? (
                      <Button
                        variant="outline"
                        onClick={() => change("page", 0)}
                      >
                        Première page
                      </Button>
                    ) : (
                      create
                    )
                  }
                />
              ) : (
                <div
                  className="console-table min-w-0 rounded-lg border"
                  data-density="standard"
                >
                  <Table>
                    <TableCaption>
                      Routeurs de {active.organizationName}
                    </TableCaption>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Routeur et site</TableHead>
                        <TableHead>États</TableHead>
                        <TableHead className="hidden lg:table-cell">
                          Dernière observation
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {query.data.content.map((router) => {
                        const site = sites.data?.find(
                          (s) => s.id === router.siteId,
                        );
                        return (
                          <TableRow key={router.id}>
                            <TableCell className="max-w-48 whitespace-normal">
                              <Link
                                className="font-medium break-words underline underline-offset-4"
                                to={routerRoutes.detail(
                                  active.organizationId,
                                  router.id,
                                  router.siteId ?? undefined,
                                )}
                              >
                                {router.name}
                              </Link>
                              <p className="mt-1 break-words text-xs text-muted-foreground">
                                {router.vendor} · {router.model}
                              </p>
                              <p className="mt-1 text-xs">
                                {site ? (
                                  <Link
                                    className="underline"
                                    to={siteRoutes.detail(
                                      active.organizationId,
                                      site.id,
                                    )}
                                  >
                                    {site.name}
                                  </Link>
                                ) : router.siteId ? (
                                  "Site non chargé"
                                ) : (
                                  "Sans site rattaché"
                                )}
                              </p>
                            </TableCell>
                            <TableCell className="whitespace-normal">
                              <dl className="space-y-2">
                                {(
                                  [
                                    "lifecycle",
                                    "provisioning",
                                    "connectivity",
                                  ] as const
                                ).map((dimension, index) => (
                                  <div
                                    key={dimension}
                                    className="flex flex-wrap items-center gap-1.5"
                                  >
                                    <dt className="text-xs text-muted-foreground">
                                      {
                                        ["Cycle", "Provisioning", "Connexion"][
                                          index
                                        ]
                                      }
                                    </dt>
                                    <dd>
                                      <RouterStatus
                                        router={router}
                                        dimension={dimension}
                                      />
                                    </dd>
                                  </div>
                                ))}
                              </dl>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <LastObservation
                                at={router.lastSeenAt}
                                timezone={site?.timezone}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <label
                    id="router-size-label"
                    htmlFor="router-size"
                    className="text-sm"
                  >
                    Par page
                  </label>
                  <Select
                    value={String(size)}
                    onValueChange={(value) =>
                      change("size", Number(value ?? 20))
                    }
                  >
                    <SelectTrigger
                      id="router-size"
                      aria-labelledby="router-size-label"
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
                <Pagination
                  className="mx-0 w-auto"
                  aria-label="Pagination des routeurs"
                >
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        variant="outline"
                        disabled={page === 0 || query.isFetching}
                        onClick={() => change("page", page - 1)}
                      >
                        Précédent
                      </Button>
                    </PaginationItem>
                    <PaginationItem>
                      <span className="px-2 text-sm">
                        {page + 1} /{" "}
                        {Math.max(
                          1,
                          Math.ceil(query.data.totalElements / size),
                        )}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <Button
                        variant="outline"
                        disabled={
                          (page + 1) * size >= query.data.totalElements ||
                          query.isFetching
                        }
                        onClick={() => change("page", page + 1)}
                      >
                        Suivant
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
