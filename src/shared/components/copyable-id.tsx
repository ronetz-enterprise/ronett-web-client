import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/cn";

/**
 * Identifiant technique en police mono, jamais tronqué au milieu, copiable en un clic avec un
 * retour « Copié » annoncé. Ne pas l'utiliser pour un secret (voir SensitiveValue).
 */
export function CopyableId({
  value,
  label = "identifiant",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }
  return (
    <span
      className={cn("inline-flex max-w-full items-center gap-1", className)}
    >
      <code className="font-mono text-xs break-all">{value}</code>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={`Copier l’${label}`}
        onClick={copy}
      >
        <HugeiconsIcon
          icon={copied ? Tick02Icon : Copy01Icon}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </Button>
      <span role="status" className="sr-only">
        {copied ? "Copié" : ""}
      </span>
    </span>
  );
}
