import type { ComponentProps } from "react";
import { cn } from "cn";

/**
 * Conteneur des pages du module sites. Il n'applique aucun thème propre : les
 * sites héritent du thème global, comme toute l'application (budget couleur,
 * docs/frontend-refonte-plan.md §2).
 */
export function SiteShell({ className, ...props }: ComponentProps<"div">) {
  // Même espacement que la zone de contenu : l'en-tête et le contenu des pages sont frères ici.
  return (
    <div
      data-slot="sites-shell"
      className={cn("space-y-6", className)}
      {...props}
    />
  );
}
