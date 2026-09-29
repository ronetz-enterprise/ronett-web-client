import { it, expect } from "vitest";
import { safeAuthDestination } from "./return-to";
it("preserves supported internal destinations only", () => {
  for (const path of [
    "/account",
    "/onboarding",
    "/onboarding/organization",
    "/app/00000000-0000-4000-8000-000000000001/organization",
  ])
    expect(safeAuthDestination(path)).toBe(path);
});
it.each([
  "https://evil.test",
  "//evil.test",
  "/\\evil.test",
  "/%2f%2fevil.test",
  "/%252f%252fevil.test",
  "/auth/login",
  "/platform-admin",
  "/app/../auth/login",
  "/account?accessToken=secret",
  "/account#token",
  "/account\n",
  null,
])("rejects unsafe or unauthorized destination %s", (value) => {
  expect(safeAuthDestination(value)).toBe("/organizations/select");
});
