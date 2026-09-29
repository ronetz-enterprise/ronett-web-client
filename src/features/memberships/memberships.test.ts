import { it, expect } from "vitest";
import {
  membershipSchema,
  membershipsSchema,
  isAccessible,
  selectionTarget,
  membershipKeys,
} from "./index";
import { membership, orgA, orgB } from "@/shared/testing/tenant-fixtures";
import { principalSchema } from "@/features/identity";
import { parseProblemDetail } from "@/shared/errors/api-error";
it("validates the exact principal and complete non-paginated membership envelope", () => {
  expect(
    principalSchema.safeParse({
      userId: orgA,
      email: "test@example.test",
      firstName: "Test",
      lastName: "Fixture",
      status: "ACTIVE",
      platformAdmin: false,
    }).success,
  ).toBe(true);
  expect(
    principalSchema.safeParse({ userId: orgA, email: "test@example.test" })
      .success,
  ).toBe(false);
  expect(membershipsSchema.safeParse({ items: [] }).success).toBe(true);
  expect(membershipsSchema.safeParse({ items: [], nextPage: 2 }).success).toBe(
    false,
  );
  expect(
    membershipSchema.safeParse({ ...membership(), organizationId: "bad" })
      .success,
  ).toBe(false);
});
it("distinguishes zero, one, many and inactive organizations", () => {
  const a = membershipSchema.parse(membership());
  const b = membershipSchema.parse(membership(orgB, "B"));
  expect(selectionTarget([])).toBe("create");
  expect(selectionTarget([a])).toBe(orgA);
  expect(selectionTarget([a, b])).toBe("select");
  expect(
    selectionTarget([{ ...a, membershipStatus: "REVOKED", permissions: [] }]),
  ).toBe("select");
  for (const membershipStatus of ["SUSPENDED", "REVOKED"] as const)
    expect(isAccessible({ ...a, membershipStatus })).toBe(false);
  for (const organizationStatus of ["SUSPENDED", "CLOSED"] as const)
    expect(isAccessible({ ...a, organizationStatus })).toBe(false);
  expect(isAccessible({ ...a, permissions: [] })).toBe(false);
  expect(membershipKeys.access(orgA)).not.toEqual(membershipKeys.access(orgB));
});
it("preserves stable problem code and extensions without using technical detail for decisions", () => {
  expect(
    parseProblemDetail({
      title: "Denied",
      status: 403,
      code: "MEMBERSHIP_REVOKED",
      detail: "private",
      correlationId: "fixture",
      extension: { safe: true },
    }),
  ).toMatchObject({ code: "MEMBERSHIP_REVOKED", extension: { safe: true } });
});
