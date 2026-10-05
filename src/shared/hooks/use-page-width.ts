import { useMatches } from "react-router";

/**
 * Largeur du contenu d'une page, déclarée par son module de route
 * (`export const handle = { width: "narrow" } satisfies PageHandle`).
 *
 * - `wide` (défaut) : toute la largeur disponible, pour les pages denses (tableaux, finances).
 * - `narrow` : colonne centrée, pour les pages au contenu court (formulaires de création).
 */
export type PageWidth = "wide" | "narrow";
export type PageHandle = { width?: PageWidth };

/** Largeur déclarée par la route la plus profonde qui en précise une. */
export function usePageWidth(): PageWidth {
  const matches = useMatches();
  for (let index = matches.length - 1; index >= 0; index--) {
    const width = (matches[index].handle as PageHandle | undefined)?.width;
    if (width) return width;
  }
  return "wide";
}
