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

export function PageLoading() {
  return (
    <div
      role="status"
      className="w-full space-y-6 p-4"
      aria-label="Chargement du contenu"
    >
      <div aria-hidden="true" className="space-y-3">
        <Skeleton className="h-8 w-1/2 max-w-72" />
        <Skeleton className="h-4 w-2/3 max-w-96" />
        <Skeleton className="h-32 w-full" />
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
export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  status,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  status?: React.ReactNode;
}) {
  return (
    <header className="space-y-4">
      {breadcrumb}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-semibold tracking-tight break-words">
              {title}
            </h1>
            {status}
          </div>
          {description && (
            <p className="max-w-prose text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
export function EmptyState({
  title = "Aucune donnée",
  description,
  actions,
  icon,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Empty className="items-start border text-left">
      <EmptyHeader className="max-w-prose items-start">
        {icon && (
          <EmptyMedia variant="icon" aria-hidden="true">
            {icon}
          </EmptyMedia>
        )}
        <h2 className="font-heading text-sm font-semibold">{title}</h2>
        {description && (
          <EmptyDescription className="text-sm">{description}</EmptyDescription>
        )}
      </EmptyHeader>
      {actions && (
        <EmptyContent className="max-w-none flex-row flex-wrap justify-start">
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
      className={`h-6 gap-1.5 rounded-md text-xs ${statusTones[tone]}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}
