import { z } from "zod";
import type { Membership } from "../queries/current-memberships";
export const memberSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  organizationId: z.uuid(),
  role: z.literal("OWNER"),
  status: z.enum(["ACTIVE", "SUSPENDED", "REVOKED"]),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
export type Member = z.infer<typeof memberSchema>;
export type MemberAction = "suspend" | "reactivate" | "revoke";
export const addMemberSchema = z.object({
  userId: z.uuid("Saisissez un UUID utilisateur valide."),
});
export function organizationCapabilities(active: Membership) {
  const ready =
    active.membershipStatus === "ACTIVE" &&
    active.organizationStatus === "ACTIVE";
  return {
    canViewOrganization:
      ready && active.permissions.includes("ORGANIZATION_READ"),
    canViewMembers: ready && active.permissions.includes("MEMBERSHIP_READ"),
    canManageMembers: ready && active.permissions.includes("MEMBERSHIP_MANAGE"),
    canInviteMembers: false,
    canChangeRoles: false,
    canEditOrganization: false,
  };
}
export function memberActions(
  active: Membership,
  target: Member,
  members: Member[],
) {
  const allowed =
    organizationCapabilities(active).canManageMembers &&
    target.organizationId === active.organizationId;
  const owners = members.filter(
    (m) =>
      m.organizationId === active.organizationId &&
      m.role === "OWNER" &&
      m.status === "ACTIVE",
  ).length;
  return {
    suspend: allowed && target.status === "ACTIVE" && owners > 1,
    reactivate: allowed && target.status === "SUSPENDED",
    revoke: allowed && target.status !== "REVOKED" && owners > 1,
  };
}
export function filterMembers(
  members: Member[],
  search: string,
  status: string,
) {
  const term = search.trim().toLowerCase();
  return members
    .filter(
      (m) =>
        (status === "ALL" || m.status === status) &&
        (m.userId.toLowerCase().includes(term) ||
          m.id.toLowerCase().includes(term)),
    )
    .sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    );
}
export const memberStatusLabel = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  REVOKED: "Révoqué",
};
