import { useId, type ReactNode } from "react";
import { Card, CardHeader, CardContent } from "@/shared/ui/card";
import { Table } from "@/shared/ui/table";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/utils/cn";

export function PageSection({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 id={id} className="font-heading text-lg font-semibold">
            {title}
          </h2>
          {description && (
            <p className="max-w-prose text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
export function SummaryCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("text-sm", className)}>
      <CardHeader>
        <h2 className="font-heading text-sm font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
export function MetricCard({
  label,
  value,
  context,
}: {
  label: string;
  value: string;
  context: string;
}) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{context}</p>
      </CardContent>
    </Card>
  );
}
export function DataTable({
  children,
  density = "standard",
}: {
  children: ReactNode;
  density?: "standard" | "compact";
}) {
  return (
    <div
      className="console-table min-w-0 rounded-lg border"
      data-density={density}
    >
      <Table
        tabIndex={0}
        className="min-w-120 text-sm [&_thead]:bg-muted/50 [&_th]:text-xs [&_th]:text-muted-foreground"
      >
        {children}
      </Table>
    </div>
  );
}
export function TableSkeleton() {
  return (
    <div
      role="status"
      aria-label="Chargement des membres"
      className="space-y-4"
    >
      <div aria-hidden="true" className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="divide-y rounded-lg border">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="grid h-13 grid-cols-3 items-center gap-4 px-4"
            >
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
