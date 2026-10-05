import {
  dialogSectionClass,
  dialogSectionTitleClass,
  useFormDialog,
} from "@/shared/components/form-dialog-context";
import { useState, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/cn";

/** Corps d'une page paramètres : contenu aligné à gauche (48 rem), sections séparées par un trait. */
export function SettingsBody({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-3xl min-w-0 space-y-10 [&>section+section]:border-t [&>section+section]:pt-10">
      {children}
    </div>
  );
}

/**
 * Gabarit « paramètres » (modèle Organization settings d'OpenAI) : sections empilées sans
 * cadre, champs empilés ; seules les listes d'actions sont encadrées.
 */
export function SettingsSection({
  id,
  title,
  description,
  children,
  className,
}: {
  /** Ancre de la section (lien direct vers `#id`). */
  id?: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  if (useFormDialog())
    return (
      <section id={id} className={cn(dialogSectionClass, className)}>
        <div className="space-y-1">
          <h3 className={dialogSectionTitleClass}>{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {children}
      </section>
    );
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn("scroll-mt-36 space-y-5", className)}
    >
      <div className="space-y-1">
        <h2
          id={id ? `${id}-title` : undefined}
          className="font-heading text-lg font-semibold tracking-tight"
        >
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * Carte de lignes séparées par un trait ; `footer` : actions alignées à droite. Les lignes
 * s'adaptent à la largeur de la carte (requêtes de conteneur), pas à celle de l'écran.
 */
export function SettingsCard({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="@container divide-y overflow-hidden rounded-xl border bg-card">
      {children}
      {footer && (
        <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}

/**
 * Champ empilé (modèle Organization settings d'OpenAI) : libellé, aide grise, puis le
 * contrôle, en colonne étroite alignée à gauche.
 */
export function SettingField({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string;
  description?: ReactNode;
  /** Identifiant du contrôle éditable ; sans lui, le libellé décrit une valeur affichée. */
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="space-y-0.5">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-sm font-medium">
            {label}
          </label>
        ) : (
          <p className="text-sm font-medium">{label}</p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="max-w-sm">{children}</div>
    </div>
  );
}

/**
 * Valeur non modifiable dans un cadre de la hauteur d'un champ ; `copy` ajoute un bouton
 * « Copier » à droite, avec un retour « Copié » annoncé.
 */
export function ReadOnlyValue({
  children,
  copy,
  mono = false,
}: {
  children: ReactNode;
  /** `label` : complément de « Copier », article compris (« l’identifiant du routeur »). */
  copy?: { value: string; label: string };
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  async function write(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div
      data-slot="read-only-value"
      className="flex min-h-9 min-w-0 items-center gap-2 rounded-lg border border-input bg-muted/40 py-1 pr-1 pl-3 text-sm"
    >
      <span
        className={cn(
          "min-w-0 flex-1 break-words",
          mono && "font-mono text-xs break-all",
        )}
      >
        {children}
      </span>
      {copy && (
        <>
          <Button
            variant="outline"
            size="xs"
            aria-label={`Copier ${copy.label}`}
            onClick={() => void write(copy.value)}
          >
            <HugeiconsIcon
              icon={copied ? Tick02Icon : Copy01Icon}
              strokeWidth={1.75}
              data-icon="inline-start"
            />
            {copied ? "Copié" : "Copier"}
          </Button>
          <span role="status" className="sr-only">
            {copied ? "Copié" : ""}
          </span>
        </>
      )}
    </div>
  );
}

/** Ligne d'action : titre et conséquence à gauche, bouton à droite. */
export function SettingsActionRow({
  title,
  description,
  action,
}: {
  title: string;
  description: ReactNode;
  action: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 p-4 @md:flex-row @md:items-center @md:justify-between @md:gap-6">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
