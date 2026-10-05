import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

/** Informations d'un objet en lignes séparées (gabarit Détail), sans carte englobante. */
export function KeyValueList({
  items,
  className,
}: {
  items: { label: string; value: ReactNode; hint?: string }[];
  className?: string;
}) {
  return (
    <dl className={cn("divide-y border-y text-sm", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="grid gap-1 py-3 sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-4"
        >
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="min-w-0 break-words">
            {item.value}
            {item.hint && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.hint}
              </p>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
