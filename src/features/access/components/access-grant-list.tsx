import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import type { Membership } from "@/features/memberships";
import { useSites } from "@/features/site";
import {
  EmptyState,
  PageHeader,
  PageLoading,
} from "@/shared/components/feedback";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/cn";
import { ApiError } from "@/shared/errors/api-error";
import {
  AccessFilterControls,
  countActiveFilters,
  emptyAccessFilters,
  type AccessFilters,
} from "./access-filters";
import {
  AccessGrantsTable,
  AccessListMetrics,
  AccessPagination,
} from "./access-grant-table";
import { AccessFailure } from "./access-shared";
import { AccessGrantPanel } from "./access-grant-details";
import { useAccessGrantList } from "../queries/access-grants";
import { accessRoutes, type AccessGrant } from "../model/access-grant";
import { accessPermissions } from "../permissions/access-permissions";

const PAGE_SIZE = 20;
const SOON_WINDOW_MS = 48 * 60 * 60 * 1000;

function readPage(value: string | null) {
  return /^\d{1,6}$/.test(value ?? "") ? Number(value) : 0;
}

/** Filtres de page : le backend ne les supporte pas, ils ne sont jamais annoncés comme serveur. */
function filterPage(grants: AccessGrant[], filters: AccessFilters) {
  const term = filters.search.trim().toLowerCase();
  const now = Date.now();
  return grants.filter((grant) => {
    if (filters.status !== "ALL" && grant.status !== filters.status)
      return false;
    if (filters.source !== "ALL" && grant.sourceType !== filters.source)
      return false;
    if (
      filters.projection !== "ALL" &&
      grant.projectionStatus !== filters.projection
    )
      return false;
    if (filters.period !== "all") {
      if (!grant.expiresAt) return false;
      const remaining = new Date(grant.expiresAt).getTime() - now;
      if (filters.period === "overdue" && remaining > 0) return false;
      if (
        filters.period === "soon" &&
        (remaining <= 0 || remaining > SOON_WINDOW_MS)
      )
        return false;
    }
    if (term) {
      const haystack =
        `${grant.accessGrantId} ${grant.username ?? ""} ${grant.sourceId ?? ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function AccessGrantList({ active }: { active: Membership }) {
  const [params, setParams] = useSearchParams();
  // Accès ouvert dans le panneau latéral : dans l'URL, pour que Retour le referme.
  const selected = uuid.test(params.get("access") ?? "")
    ? params.get("access")
    : null;
  const panel = useRef<HTMLElement>(null);
  /** Referme le panneau et rend le focus à la ligne qui l'avait ouvert. */
  const closePanel = useCallback(() => {
    const search = new URLSearchParams(window.location.search);
    const id = search.get("access");
    search.delete("access");
    setParams(search, { preventScrollReset: true });
    window.setTimeout(() => {
      if (id)
        document
          .querySelector<HTMLElement>(`[data-access-id="${CSS.escape(id)}"]`)
          ?.focus();
    }, 50);
  }, [setParams]);
  // Échap referme le panneau quand le focus y est (une confirmation ouverte garde la main).
  useEffect(() => {
    if (!selected) return;
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key !== "Escape" ||
        event.defaultPrevented ||
        document.querySelector("[role=alertdialog]") ||
        !panel.current?.contains(event.target as Node)
      )
        return;
      closePanel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected, closePanel]);
  const [filters, setFilters] = useState<AccessFilters>(() => ({
    ...emptyAccessFilters,
    siteId: /^[0-9a-f-]{36}$/i.test(params.get("site") ?? "")
      ? params.get("site")
      : null,
  }));
  const page = readPage(params.get("page"));
  const sites = useSites(active);
  // Le site est le seul filtre transmis au serveur : il change la clé de query
  // et recharge la liste depuis l'endpoint scopé au site.
  const query = useAccessGrantList(active, page, PAGE_SIZE, filters.siteId);
  const permissions = accessPermissions(active);
  const siteNames = useMemo(
    () => new Map((sites.data ?? []).map((site) => [site.id, site.name])),
    [sites.data],
  );

  function updateParams(next: Partial<Record<string, string>>) {
    const search = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value) search.set(key, value);
      else search.delete(key);
    }
    setParams(search, { replace: true, preventScrollReset: true });
  }

  function hrefFor(accessGrantId: string) {
    const search = new URLSearchParams(params);
    search.set("access", accessGrantId);
    return `?${search.toString()}`;
  }

  function changeFilters(next: AccessFilters) {
    setFilters(next);
    // Un changement de filtre invalide la page courante et le site mis en URL.
    const search = new URLSearchParams(params);
    search.delete("page");
    if (next.siteId) search.set("site", next.siteId);
    else search.delete("site");
    setParams(search, { replace: true, preventScrollReset: true });
  }

  if (!permissions.canViewAccessGrants)
    return <AccessFailure error={new ApiError("http", 403)} />;
  if (query.isPending || sites.isPending) return <PageLoading />;
  const transient =
    query.error instanceof ApiError &&
    (["network", "timeout", "aborted"].includes(query.error.kind) ||
      query.error.status >= 500 ||
      query.error.status === 429);
  if (!query.data || !sites.data || (query.isError && !transient))
    return (
      <AccessFailure
        error={query.error ?? sites.error}
        retry={() => void query.refetch()}
      />
    );

  const { content, totalElements } = query.data;
  const filtered = filterPage(content, filters);
  const lastPage = Math.max(0, Math.ceil(totalElements / PAGE_SIZE) - 1);
  const filtering = countActiveFilters(filters) > 0;

  return (
    <>
      <PageHeader
        title="Accès Internet"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
            >
              <HugeiconsIcon
                icon={RefreshIcon}
                data-icon="inline-start"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              {query.isFetching ? "Actualisation…" : "Actualiser"}
            </Button>
            {permissions.canCreateManualAccess && (
              <Button
                nativeButton={false}
                role="link"
                render={<Link to={accessRoutes.create()} />}
              >
                <HugeiconsIcon
                  icon={Add01Icon}
                  data-icon="inline-start"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                Créer un accès
              </Button>
            )}
          </div>
        }
      />

      {/* Collé sous l'en-tête et aux bords de la page : blocs séparés par des traits. */}
      <div className="page-bleed -mt-6">
        {query.isError && (
          <p
            role="status"
            className="border-b px-(--page-gutter) py-3 text-sm text-muted-foreground"
          >
            La liste n’a pas pu être actualisée : elle peut ne pas être à jour.
          </p>
        )}

        <AccessListMetrics grants={filtered} />

        {/* Seules la recherche et la liste sont poussées par le panneau ; les compteurs restent. */}
        <div className="flex min-h-[calc(100svh-4rem)]">
          <div className="min-w-0 flex-1">
            <div className="space-y-2 border-b px-(--page-gutter) py-3">
              <AccessFilterControls
                filters={filters}
                onChange={changeFilters}
                sites={sites.data}
                count={filtered.length}
              />
              {filtering && totalElements > content.length && (
                <p className="text-xs text-muted-foreground">
                  Les filtres autres que le site portent sur les{" "}
                  {content.length} accès de cette page.
                </p>
              )}
            </div>

            {!content.length ? (
              <div className="border-b">
                <EmptyState
                  objectType="access"
                  title="Aucun accès pour l’instant"
                  description="Les accès apparaissent ici dès qu’un client en achète un sur le portail de votre site, ou quand vous en créez un vous-même."
                />
              </div>
            ) : !filtered.length ? (
              <div className="border-b">
                <EmptyState
                  objectType="access"
                  variant="filtered"
                  title="Aucun accès ne correspond"
                  description="Modifiez la recherche ou retirez un filtre."
                />
              </div>
            ) : (
              <AccessGrantsTable
                grants={filtered}
                siteNames={siteNames}
                selectedId={selected}
                hrefFor={hrefFor}
              />
            )}

            {content.length > 0 && (
              <AccessPagination
                page={page}
                lastPage={lastPage}
                total={totalElements}
                onChange={(next) => updateParams({ page: String(next) })}
              />
            )}
          </div>

          {/* Détail d'un accès : panneau qui sort de la droite et pousse la liste. */}
          {/*
          Détail d'un accès : panneau qui sort de la droite et pousse la liste ; sur téléphone,
          il passe en plein écran par-dessus la liste.
        */}
          <aside
            ref={panel}
            aria-labelledby={selected ? "access-panel-title" : undefined}
            aria-hidden={selected ? undefined : true}
            className={cn(
              "shrink-0 overflow-hidden bg-background transition-[width] duration-200 ease-out motion-reduce:transition-none",
              selected
                ? "w-[28rem] border-l xl:w-[32rem] max-md:fixed max-md:inset-0 max-md:z-40 max-md:w-full max-md:border-l-0"
                : "w-0",
            )}
          >
            <div className="sticky top-16 h-[calc(100svh-4rem)] w-[28rem] xl:w-[32rem] max-md:static max-md:h-full max-md:w-full">
              {selected && (
                <AccessGrantPanel
                  active={active}
                  accessGrantId={selected}
                  onClose={closePanel}
                />
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
