import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/shared/utils/cn";

const steps = ["Compte créé", "Organisation", "Tableau de bord"];

/** Étapes de l'inscription ; `current` est l'index de l'étape en cours. */
export function OnboardingSteps({ current }: { current: number }) {
  return (
    <ol aria-label="Étapes de démarrage" className="flex items-center gap-2">
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className="flex min-w-0 flex-1 items-center gap-2"
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary text-primary ring-4 ring-primary/10",
                !done && !active && "text-muted-foreground",
              )}
            >
              {done ? (
                <HugeiconsIcon
                  icon={Tick02Icon}
                  strokeWidth={2.5}
                  className="size-3.5"
                />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={cn(
                "truncate text-xs",
                active ? "font-medium" : "text-muted-foreground",
              )}
            >
              {label}
              <span className="sr-only">
                {done ? " (terminé)" : active ? " (en cours)" : " (à venir)"}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
