import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { ApiError, toUserMessage } from "@/shared/errors/api-error";

export function PageLoading() {
  return (
    <p role="status" className="p-4">
      Chargement…
    </p>
  );
}
export function AppLoading() {
  return (
    <main className="grid min-h-svh place-items-center">
      <PageLoading />
    </main>
  );
}
export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="space-y-2">
      <h1 className="font-heading text-2xl font-semibold">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </header>
  );
}
export function EmptyState({
  title = "Aucune donnée",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="rounded-xl border border-dashed p-6">
      <h2 className="font-medium">{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
    </section>
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
    <section role="alert" className="space-y-3 rounded-xl border p-4">
      <h2 className="font-semibold">{title}</h2>
      <p>{message}</p>
      {children}
    </section>
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
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const styles = {
    neutral: "bg-muted text-foreground",
    success: "bg-emerald-100 text-emerald-950",
    warning: "bg-amber-100 text-amber-950",
    danger: "bg-red-100 text-red-950",
  };
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${styles[tone]}`}
    >
      {label}
    </span>
  );
}
