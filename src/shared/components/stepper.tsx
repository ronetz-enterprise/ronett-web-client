import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Spinner } from "@/shared/ui/spinner";
import { cn } from "@/shared/utils/cn";
import { formatDateTime, formatRelative } from "@/shared/utils/format";

export type StepState =
  "complete" | "current" | "running" | "error" | "upcoming";

export type Step = {
  id: string;
  title: string;
  description?: ReactNode;
  at?: string | null;
  state: StepState;
  /** Contenu affiché sous l'étape (par exemple, ce qu'il reste à faire pour l'étape en cours). */
  detail?: ReactNode;
};

const stateLabels: Record<StepState, string> = {
  complete: "terminée",
  current: "en cours",
  running: "en cours",
  error: "en échec",
  upcoming: "à venir",
};

function StepIndicator({ state, index }: { state: StepState; index: number }) {
  return (
    <span
      aria-hidden="true"
      data-slot="stepper-indicator"
      data-state={state}
      className={cn(
        "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums",
        state === "complete" && "bg-primary text-primary-foreground",
        (state === "current" || state === "running") &&
          "bg-background text-primary ring-2 ring-primary ring-inset",
        state === "error" &&
          "bg-danger text-danger-foreground ring-1 ring-danger-border ring-inset",
        state === "upcoming" &&
          "bg-background text-muted-foreground ring-1 ring-border ring-inset",
      )}
    >
      {state === "complete" ? (
        <HugeiconsIcon
          icon={Tick02Icon}
          strokeWidth={2.5}
          className="size-3.5"
        />
      ) : state === "error" ? (
        <HugeiconsIcon
          icon={Cancel01Icon}
          strokeWidth={2.5}
          className="size-3.5"
        />
      ) : state === "running" ? (
        <Spinner className="size-3.5" role={undefined} aria-hidden="true" />
      ) : (
        index + 1
      )}
    </span>
  );
}

/**
 * Étapes d'un processus en colonne : pastille numérotée (cochée une fois franchie) reliée à
 * la suivante par un trait, plein jusqu'à l'étape en cours. shadcn/ui n'en fournit pas.
 */
export function Stepper({
  steps,
  label,
  className,
}: {
  steps: Step[];
  label: string;
  className?: string;
}) {
  return (
    <ol
      aria-label={label}
      data-slot="stepper"
      className={cn("text-sm", className)}
    >
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const active = step.state === "current" || step.state === "running";
        return (
          <li
            key={step.id}
            data-slot="stepper-item"
            data-state={step.state}
            aria-current={active ? "step" : undefined}
            className="relative flex gap-3 pb-5 last:pb-0"
          >
            {!last && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-7 bottom-1 left-3 w-px -translate-x-1/2",
                  step.state === "complete" ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <StepIndicator state={step.state} index={index} />
            <div className="min-w-0 flex-1 pt-0.5">
              <p
                className={cn(
                  "leading-5 font-medium",
                  step.state === "upcoming" && "text-muted-foreground",
                  step.state === "error" && "text-danger-foreground",
                )}
              >
                {step.title}
                <span className="sr-only"> ({stateLabels[step.state]})</span>
              </p>
              {step.description && (
                <div className="mt-0.5 text-muted-foreground">
                  {step.description}
                </div>
              )}
              {step.at && (
                <time
                  dateTime={step.at}
                  title={formatDateTime(step.at)}
                  className="mt-0.5 block text-xs text-muted-foreground"
                >
                  {formatRelative(step.at)}
                </time>
              )}
              {step.detail && <div className="mt-3">{step.detail}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
