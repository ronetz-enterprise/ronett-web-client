import { useSyncExternalStore } from "react";
import { onlineManager } from "@tanstack/react-query";

/**
 * État de connexion partagé avec TanStack Query : hors ligne, les requêtes et mutations sont
 * mises en pause par la bibliothèque ; l'interface l'annonce et suspend les envois.
 */
export function useOnline() {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
    () => true,
  );
}
