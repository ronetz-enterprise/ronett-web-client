import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/shared/ui/button";
import { ApiError } from "@/shared/errors/api-error";
import { PageHeader, StatusBadge } from "@/shared/components/feedback";
import {
  DataTable,
  MetricCard,
  PageSection,
} from "@/shared/components/page-patterns";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/shared/ui/pagination";
import { formatCount } from "../formatters/platform";

export const PLATFORM_PAGE_SIZE = 20;

/** En-tête commun des écrans plateforme : le périmètre plateforme est explicite. */
export function PlatformPageHeader({
  title,
  description,
  actions,
  status,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  status?: ReactNode;
}) {
  return (
    <PageHeader
      title={title}
      description={description}
      actions={actions}
      status={status}
    />
  );
}

/**
 * Absence de permission : l'écran ne s'affiche pas, la décision reste côté
 * serveur. Le message ne divulgue ni contenu ni identifiant.
 */
export function PlatformForbidden({ area }: { area: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-control-border bg-card p-4 text-sm"
    >
      <HugeiconsIcon
        icon={AlertIcon}
        strokeWidth={1.75}
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <div className="space-y-1">
        <p className="font-medium">{area} non accessible</p>
        <p className="text-muted-foreground">
          Votre compte ne dispose pas de la permission requise pour cette
          consultation.
        </p>
      </div>
    </div>
  );
}

/** Un 403 sur une requête déjà autorisée relève de la session ou du droit, pas de l'écran. */
export function PlatformFailure({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  if (error instanceof ApiError && error.status === 403)
    return <PlatformForbidden area="La console plateforme" />;
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-card p-4 text-sm"
    >
      <HugeiconsIcon
        icon={AlertIcon}
        strokeWidth={1.75}
        className="mt-0.5 size-4 shrink-0 text-destructive"
        aria-hidden="true"
      />
      <div className="space-y-1">
        <p className="font-medium">Consultation impossible</p>
        <p className="text-muted-foreground">
          {error instanceof ApiError
            ? `La plateforme n'a pas pu répondre (${error.status || error.kind}).`
            : "La plateforme n'a pas pu répondre."}
        </p>
        {retry && (
          <Button variant="outline" size="sm" onClick={retry}>
            Réessayer
          </Button>
        )}
      </div>
    </div>
  );
}

export function PlatformMetrics({
  items,
}: {
  items: { label: string; value: string; context: string }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <MetricCard
          key={item.label}
          label={item.label}
          value={item.value}
          context={item.context}
        />
      ))}
    </div>
  );
}

export function PlatformTable({ children }: { children: ReactNode }) {
  return <DataTable density="compact">{children}</DataTable>;
}

/**
 * Pagination serveur : le backend renvoie page, taille et nombre total.
 * Le caller ne fournit que la page courante.
 */
export function PlatformPagination({
  page,
  totalElements,
  totalPages,
  onChange,
  label,
}: {
  page: number;
  totalElements: number;
  totalPages: number;
  onChange: (page: number) => void;
  label: string;
}) {
  const lastPage = Math.max(0, totalPages - 1);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">
        {formatCount(totalElements)} {label} · page {page + 1} sur{" "}
        {lastPage + 1}
      </p>
      <Pagination aria-label={`Pagination ${label}`}>
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="outline"
              disabled={page <= 0}
              onClick={() => onChange(Math.max(0, page - 1))}
            >
              Page précédente
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button
              variant="outline"
              disabled={page >= lastPage || totalElements === 0}
              onClick={() => onChange(Math.min(lastPage, page + 1))}
            >
              Page suivante
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export function PlatformSection({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <PageSection title={title} description={description} actions={actions}>
      {children}
    </PageSection>
  );
}

export { StatusBadge, formatCount };
