import { it, expect } from "vitest";
import { membershipSchema } from "../queries/current-memberships";
import { membership, orgA, orgB } from "@/shared/testing/tenant-fixtures";
import {
  organizationCapabilities,
  memberActions,
  memberSchema,
  filterMembers,
  addMemberSchema,
} from "./member";
import { organizationMemberKeys } from "../queries/organization-members";
const active = membershipSchema.parse(membership());
const first = memberSchema.parse({
  id: orgA,
  userId: "00000000-0000-4000-8000-000000000099",
  organizationId: orgA,
  role: "OWNER",
  status: "ACTIVE",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
});
const second = {
  ...first,
  id: orgB,
  userId: "00000000-0000-4000-8000-000000000077",
};
it("derives capabilities from explicit permissions and active statuses", () => {
  expect(organizationCapabilities(active)).toMatchObject({
    canViewMembers: true,
    canManageMembers: true,
    canInviteMembers: false,
    canEditOrganization: false,
    canChangeRoles: false,
  });
  expect(
    organizationCapabilities({ ...active, permissions: ["ORGANIZATION_READ"] })
      .canManageMembers,
  ).toBe(false);
  expect(
    organizationCapabilities({ ...active, membershipStatus: "SUSPENDED" })
      .canViewMembers,
  ).toBe(false);
  expect(
    organizationCapabilities({ ...active, organizationStatus: "CLOSED" })
      .canManageMembers,
  ).toBe(false);
});
it("protects the last OWNER from suspension or revocation without inventing a role", () => {
  expect(memberActions(active, first, [first])).toEqual({
    suspend: false,
    reactivate: false,
    revoke: false,
  });
  expect(memberActions(active, first, [first, second])).toEqual({
    suspend: true,
    reactivate: false,
    revoke: true,
  });
});
it("matches the lifecycle and rejects foreign targets", () => {
  expect(
    memberActions(active, { ...first, status: "SUSPENDED" }, [first, second]),
  ).toEqual({ suspend: false, reactivate: true, revoke: true });
  expect(
    memberActions(active, { ...first, status: "REVOKED" }, [first, second]),
  ).toEqual({ suspend: false, reactivate: false, revoke: false });
  expect(
    memberActions(active, { ...first, organizationId: orgB }, [first, second]),
  ).toEqual({ suspend: false, reactivate: false, revoke: false });
});
it("validates DTOs and never accepts an unsupported role", () => {
  expect(memberSchema.safeParse({ ...first, role: "ADMIN" }).success).toBe(
    false,
  );
  expect(
    addMemberSchema.safeParse({ userId: "email@example.test" }).success,
  ).toBe(false);
  expect(addMemberSchema.safeParse({ userId: first.userId }).success).toBe(
    true,
  );
});
it("filters the complete local list without treating UUIDs as names or emails", () => {
  expect(
    filterMembers(
      [first, { ...second, status: "SUSPENDED" }],
      "077",
      "SUSPENDED",
    ),
  ).toHaveLength(1);
  expect(filterMembers([first, second], "absent", "ALL")).toEqual([]);
  expect(organizationMemberKeys.list(orgA)).not.toEqual(
    organizationMemberKeys.list(orgB),
  );
});
