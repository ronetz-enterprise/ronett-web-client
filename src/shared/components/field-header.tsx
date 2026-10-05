import type { ReactNode } from "react";

/**
 * En-tête de champ des modales : libellé, puis description courte juste en dessous, avant la
 * saisie ; `aside` se place à droite du libellé (ex. : interrupteur « Illimité »).
 */
export function FieldHeader({
  htmlFor,
  label,
  description,
  descriptionId,
  aside,
}: {
  htmlFor: string;
  label: ReactNode;
  description?: ReactNode;
  descriptionId?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex min-h-5 items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {aside}
      </div>
      {description && (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
