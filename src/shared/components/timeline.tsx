import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { formatDateTime, formatRelative } from "@/shared/utils/format";
import type { StatusTone } from "./status";

export type TimelineEvent = {
  id: string;
  title: string;
  description?: ReactNode;
  at?: string | null;
  tone?: StatusTone;
  /** Étape pas encore atteinte : point creux, texte atténué. */
  upcoming?: boolean;
};

const marker: Record<StatusTone, string> = {
  neutral: "bg-muted-foreground/60",
  pending: "bg-muted-foreground/60",
  info: "bg-info-foreground",
  success: "bg-primary",
  warning: "bg-warning-foreground",
  danger: "bg-danger-foreground",
};

/** Historique ou étapes d'un processus (provisioning, retrait, changements d'un accès). */
export function Timeline({
  events,
  className,
}: {
  events: TimelineEvent[];
  className?: string;
}) {
  return (
    <ol className={cn("relative space-y-5 border-l pl-6", className)}>
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span
            aria-hidden="true"
            className={cn(
              "absolute top-1 -left-[calc(1.5rem+4.5px)] size-2.5 rounded-full ring-4 ring-background",
              event.upcoming
                ? "border border-muted-foreground/50 bg-background"
                : marker[event.tone ?? "success"],
            )}
          />
          <p
            className={cn(
              "text-sm font-medium",
              event.upcoming && "text-muted-foreground",
            )}
          >
            {event.title}
            {event.upcoming && <span className="sr-only"> (à venir)</span>}
          </p>
          {event.description && (
            <div className="mt-0.5 text-sm text-muted-foreground">
              {event.description}
            </div>
          )}
          {event.at && (
            <time
              dateTime={event.at}
              title={formatDateTime(event.at)}
              className="mt-0.5 block text-xs text-muted-foreground"
            >
              {formatRelative(event.at)}
            </time>
          )}
        </li>
      ))}
    </ol>
  );
}
