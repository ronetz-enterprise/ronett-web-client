import type { ComponentProps } from "react";
import { cn } from "cn";
import "../theme/sites-theme.css";

/**
 * Racine de portee du theme experimental du module sites.
 *
 * A poser sur la page, et non sur le composant de feature, pour que le theme
 * couvre toute la surface du module (listes, detail, formulaire, routeur) sans
 * deborder sur le reste de l'application.
 */
export function SiteShell({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sites-shell"
      className={cn("sites-shell", className)}
      {...props}
    />
  );
}
