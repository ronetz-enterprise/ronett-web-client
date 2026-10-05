import { createContext, useContext } from "react";
import type { Membership } from "@/features/memberships";
export const OrganizationContext = createContext<Membership | null>(null);
export function useActiveOrganization() {
  const value = useContext(OrganizationContext);
  if (!value) throw new Error("Contexte organisation validé requis.");
  return value;
}

/**
 * Contexte organisation facultatif : les surfaces qui existent aussi hors
 * organisation, comme l'administration plateforme, lisent la valeur et
 * traitent l'absence au lieu de lever.
 */
export function useOptionalOrganization() {
  return useContext(OrganizationContext);
}
