import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** Vrai si l'utilisateur demande moins de mouvement ; vrai aussi côté serveur (prudence). */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => !window.matchMedia || window.matchMedia(QUERY).matches,
    () => true,
  );
}
