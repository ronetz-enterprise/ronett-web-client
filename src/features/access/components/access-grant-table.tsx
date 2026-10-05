import { Link } from "react-router";
import { Meter } from "@/shared/components/meter";
import { MetricBlock } from "@/shared/components/analytics-band";
import { StatusDot } from "@/shared/components/status-dot";
import { formatNumber } from "@/shared/utils/format";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { formatInstant, formatValidity } from "../formatters/access";
import {
  accessDisplayState,
  validityUsage,
  accessGrantLabel,
  accessSourceLabels,
  isFailedProjection,
  type AccessGrant,
} from "../model/access-grant";

/**
 * Tableau des accès, dans le vocabulaire du gérant : une information par colonne, un seul état
 * lisible (l'état de l'accès et son état sur le réseau réunis). Aucun mot de passe.
 */
export function AccessStatusDot({ grant }: { grant: AccessGrant }) {
  const state = accessDisplayState(grant);
  return (
    <StatusDot label={state.label} tone={state.tone} live={state.usable} />
  );
}

/** Temps restant avant l'expiration, avec la jauge du temps déjà écoulé. */
export function AccessRemaining({
  grant,
  className,
  compact = false,
}: {
  grant: AccessGrant;
  className?: string;
  /** Dans le tableau : le temps restant en texte seul, sans jauge, pour des lignes basses. */
  compact?: boolean;
}) {
  const usage = validityUsage(grant);
  if (!usage)
    return (
      <span className="text-sm text-muted-foreground">Pas encore activé</span>
    );
  const left = Math.max(0, usage.total - usage.elapsed);
  if (left === 0)
    return <span className="text-sm text-muted-foreground">Terminé</span>;
  if (compact)
    return (
      <span className="text-sm tabular-nums">
        {formatValidity(Math.floor(left / 1000))}
      </span>
    );
  return (
    <Meter
      className={className}
      label="Temps restant"
      value={usage.elapsed}
      max={usage.total}
      valueLabel={formatValidity(Math.floor(left / 1000))}
    />
  );
}

/** Identifiant de connexion de l'accès, ou un repère lisible s'il n'est pas encore prêt. */
function accessName(grant: AccessGrant) {
  return grant.username ?? `Accès ${grant.accessGrantId.slice(0, 8)}`;
}

export function AccessGrantsTable({
  grants,
  siteNames,
  selectedId,
  hrefFor,
}: {
  grants: AccessGrant[];
  siteNames: Map<string, string>;
  /** Accès ouvert dans le panneau latéral. */
  selectedId: string | null;
  /** Lien qui ouvre un accès dans le panneau (même page, paramètre d'URL). */
  hrefFor: (accessGrantId: string) => string;
}) {
  return (
    <div className="min-w-0 border-b [&_[data-slot=table-container]]:scrollbar-none">
      {/* Tableau dès la tablette ; les cartes prennent le relais sur mobile. */}
      <Table className="hidden text-sm md:table">
        <TableCaption className="sr-only">
          Accès Internet de l’organisation
        </TableCaption>
        <TableHeader className="bg-muted/60">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-9 text-xs font-medium text-muted-foreground">
              Accès
            </TableHead>
            <TableHead className="h-9 text-xs font-medium text-muted-foreground">
              Origine
            </TableHead>
            <TableHead className="h-9 text-xs font-medium text-muted-foreground">
              Site
            </TableHead>
            <TableHead className="h-9 text-xs font-medium text-muted-foreground">
              État
            </TableHead>
            <TableHead className="h-9 text-xs font-medium text-muted-foreground">
              Temps restant
            </TableHead>
            {!selectedId && (
              <TableHead className="h-9 text-xs font-medium text-muted-foreground">
                Expire le
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {grants.map((grant) => (
            <TableRow
              key={grant.accessGrantId}
              data-state={
                grant.accessGrantId === selectedId ? "selected" : undefined
              }
              // Ligne ouverte dans le panneau : repère neutre (gris léger et trait encre à gauche).
              className="group/row data-[state=selected]:bg-muted/60"
            >
              <TableCell className="h-(--table-row-compact) py-1.5 group-data-[state=selected]/row:shadow-[inset_2px_0_0_var(--color-foreground)]">
                <Link
                  data-access-id={grant.accessGrantId}
                  aria-current={
                    grant.accessGrantId === selectedId ? "true" : undefined
                  }
                  className="font-medium hover:underline hover:underline-offset-4"
                  to={hrefFor(grant.accessGrantId)}
                >
                  {accessName(grant)}
                </Link>
              </TableCell>
              <TableCell className="py-1.5 whitespace-nowrap">
                {accessGrantLabel(accessSourceLabels, grant.sourceType)}
              </TableCell>
              <TableCell className="max-w-48 truncate py-1.5">
                {siteNames.get(grant.siteId) ?? "—"}
              </TableCell>
              <TableCell className="py-1.5">
                <AccessStatusDot grant={grant} />
              </TableCell>
              <TableCell className="py-1.5 whitespace-nowrap">
                <AccessRemaining grant={grant} compact />
              </TableCell>
              {/* Panneau ouvert : la liste rétrécit, « Temps restant » suffit. */}
              {!selectedId && (
                <TableCell className="py-1.5 whitespace-nowrap text-muted-foreground">
                  {formatInstant(grant.expiresAt)}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ul className="divide-y md:hidden">
        {grants.map((grant) => (
          <li key={grant.accessGrantId} className="min-w-0">
            <Link
              to={hrefFor(grant.accessGrantId)}
              aria-current={
                grant.accessGrantId === selectedId ? "true" : undefined
              }
              className="block space-y-2 px-(--page-gutter) py-4 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
            >
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">
                  {accessName(grant)}
                </p>
                <AccessStatusDot grant={grant} />
              </div>
              <AccessRemaining grant={grant} />
              <p className="text-xs text-muted-foreground">
                {siteNames.get(grant.siteId) ?? "Site inconnu"} ·{" "}
                {accessGrantLabel(accessSourceLabels, grant.sourceType)} ·
                expire le {formatInstant(grant.expiresAt)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Compteurs des accès affichés sur cette page (état actuel, pas un historique) : bande bord à
 * bord, blocs séparés par des traits, comme sur la page Finances.
 */
export function AccessListMetrics({ grants }: { grants: AccessGrant[] }) {
  const states = grants.map((grant) => ({
    grant,
    state: accessDisplayState(grant),
  }));
  const usable = states.filter(({ state }) => state.usable).length;
  const activating = states.filter(
    ({ state }) => state.tone === "pending",
  ).length;
  const failed = states.filter(({ grant }) =>
    isFailedProjection(grant.projectionStatus),
  ).length;
  return (
    <section
      aria-label="Résumé des accès"
      className="grid divide-y border-b sm:grid-cols-3 sm:divide-x sm:divide-y-0"
    >
      <MetricBlock label="Actifs" value={formatNumber(usable)}>
        <p className="text-xs text-muted-foreground">
          Clients pouvant se connecter · sur cette page
        </p>
      </MetricBlock>
      <MetricBlock
        label="En cours d’activation"
        value={formatNumber(activating)}
      >
        <p className="text-xs text-muted-foreground">
          Bientôt utilisables · sur cette page
        </p>
      </MetricBlock>
      <MetricBlock label="Problèmes d’activation" value={formatNumber(failed)}>
        <p className="text-xs text-muted-foreground">
          Nouvelle tentative automatique · sur cette page
        </p>
      </MetricBlock>
    </section>
  );
}

/** Pied de liste : total, puis la pagination quand il y a plusieurs pages. */
export function AccessPagination({
  page,
  lastPage,
  total,
  onChange,
}: {
  page: number;
  lastPage: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-(--page-gutter) py-2.5 text-sm text-muted-foreground">
      <p role="status">Total : {formatNumber(total)} accès</p>
      {lastPage > 0 && (
        <nav
          aria-label="Pagination des accès"
          className="flex items-center gap-1"
        >
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 0}
            onClick={() => onChange(Math.max(0, page - 1))}
          >
            Précédent
          </Button>
          <span className="px-2 tabular-nums">
            {page + 1} / {lastPage + 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= lastPage}
            onClick={() => onChange(Math.min(lastPage, page + 1))}
          >
            Suivant
          </Button>
        </nav>
      )}
    </div>
  );
}
