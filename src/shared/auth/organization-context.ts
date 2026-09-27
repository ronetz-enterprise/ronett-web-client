import { useOutletContext } from "react-router";
export type OrganizationContext = { organizationId: string; provisional: true };
export function useOrganizationContext() {
  return useOutletContext<OrganizationContext>();
}
