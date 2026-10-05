import { IconTile } from "./icon-tile";
import { objectIcons, type ObjectType } from "./object-icons";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import {
  Empty,
  EmptyHeader,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/shared/ui/empty";
import { statusTones, type StatusTone } from "./status";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { ApiError, toUserMessage } from "@/shared/errors/api-error";

/**
 * Chargement initial à la forme du contenu attendu (docs/ui-layout-guidelines.md §7), pour
 * que la page ne « saute » pas à l'arrivée des données.
 */
export function PageLoading({
  variant = "list",
}: {
  variant?: "list" | "detail" | "overview" | "form";
}) {
  return (
    <div
      role="status"
      aria-label="Chargement du contenu"
      className="w-full space-y-6"
    >
      <div aria-hidden="true" className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-7 w-48" />
          {variant === "detail" && <Skeleton className="h-4 w-64" />}
        </div>
        {variant === "list" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="divide-y rounded-xl border">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="flex h-11 items-center gap-4 px-4">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="ml-auto h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        )}
        {variant === "overview" && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-28 w-full" />
            ))}
          </div>
        )}
        {variant === "detail" && (
          <div className="divide-y border-y">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="grid gap-4 py-3 sm:grid-cols-[12rem_1fr]"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        )}
        {variant === "form" && (
          <div className="max-w-2xl space-y-5">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        )}
      </div>
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
export function AppLoading() {
  return (
    <main className="mx-auto flex min-h-svh max-w-5xl items-center p-4">
      <PageLoading />
    </main>
  );
}
/**
 * En-tête unique de toutes les pages (docs/ui-layout-guidelines.md §4) : fil
 * d'Ariane facultatif, titre et statut, actions alignées à droite, onglets
 * facultatifs posés sur la bordure basse.
 */
export function PageHeader({
  title,
  actions,
  breadcrumb,
  status,
  tabs,
}: {
  title: string;
  /** Accepté pour compatibilité ; l'en-tête n'affiche plus de description (modèle OpenAI). */
  description?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  status?: React.ReactNode;
  /** Onglets de page (`Tabs variant="line"`) : ils touchent la bordure basse. */
  tabs?: React.ReactNode;
}) {
  return (
    <header
      data-slot="page-header"
      data-tabs={tabs ? "" : undefined}
      className="space-y-3"
    >
      {breadcrumb}
      <div className="flex flex-col gap-3 sm:min-h-9 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-0.5">
          <div className="flex  flex-wrap items-center gap-2.5">
            <h1
              tabIndex={-1}
              className="font-heading text-xl font-semibold tracking-tight break-words outline-none"
            >
              {title}
            </h1>
            {status}
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      {tabs}
    </header>
  );
}
/**
 * État vide. `objectType` dessine une illustration composée (tuile de l'objet et deux
 * silhouettes atténuées) ; `variant` distingue l'absence de données, l'absence de résultat
 * après filtre et un prérequis manquant. Les appels sans ces options restent inchangés.
 */
export function EmptyState({
  title = "Aucune donnée",
  description,
  actions,
  icon,
  objectType,
  variant = "empty",
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  objectType?: ObjectType;
  variant?: "empty" | "filtered" | "prerequisite";
}) {
  const illustrated = objectType !== undefined;
  return (
    <Empty
      data-variant={variant}
      className={
        illustrated ? "py-14" : "items-start rounded-xl border p-5 text-left"
      }
    >
      <EmptyHeader
        className={illustrated ? "max-w-sm" : "max-w-prose items-start"}
      >
        {illustrated ? (
          <IconTile
            type={variant === "filtered" ? undefined : objectType}
            icon={variant === "filtered" ? objectIcons.usage : undefined}
            size="lg"
            className="mb-2"
          />
        ) : (
          icon && (
            <EmptyMedia variant="icon" aria-hidden="true">
              {icon}
            </EmptyMedia>
          )
        )}
        <h2 className="font-heading text-base font-semibold">{title}</h2>
        {description && (
          <EmptyDescription className="text-sm">{description}</EmptyDescription>
        )}
      </EmptyHeader>
      {actions && (
        <EmptyContent
          className={
            illustrated
              ? "flex-row flex-wrap justify-center"
              : "max-w-none flex-row flex-wrap justify-start"
          }
        >
          {actions}
        </EmptyContent>
      )}
    </Empty>
  );
}
export function CorrelationIdDisplay({
  correlationId,
}: {
  correlationId: string;
}) {
  const [message, setMessage] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(correlationId);
      setMessage("Référence copiée.");
    } catch {
      setMessage(
        "Copie indisponible. Sélectionnez la référence pour la copier.",
      );
    }
  }
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
      <span>
        Référence :{" "}
        <code className="break-all select-all">{correlationId}</code>
      </span>
      <Button variant="outline" onClick={() => void copy()}>
        Copier la référence
      </Button>
      <span role="status">{message}</span>
    </div>
  );
}
export function ErrorState({
  title = "Une erreur est survenue",
  message,
  children,
}: {
  title?: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>
        <h2>{title}</h2>
      </AlertTitle>
      <AlertDescription className="space-y-3 text-sm">
        <p>{message}</p>
        {children}
      </AlertDescription>
    </Alert>
  );
}
export function TechnicalError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  return (
    <ErrorState message={toUserMessage(error)}>
      {error instanceof ApiError && error.correlationId && (
        <CorrelationIdDisplay correlationId={error.correlationId} />
      )}
      {onRetry && <Button onClick={onRetry}>Réessayer</Button>}
    </ErrorState>
  );
}
export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: StatusTone;
}) {
  return (
    <Badge
      variant="secondary"
      className={`h-6 gap-1.5 px-2.5 text-xs ${statusTones[tone]}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}
