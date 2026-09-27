import { expect, it } from "vitest";
import { safeRedirect } from "./safe-redirect";
it.each([
  "https://evil.test",
  "//evil.test",
  "/\\evil.test",
  "/%2fevil.test",
  "/%5cevil.test",
  "/%0aevil.test",
  "/%",
])("rejects unsafe redirect %s", (value) =>
  expect(safeRedirect(value)).toBe("/"),
);
it("keeps a local path and query", () =>
  expect(safeRedirect("/auth/login?next=home")).toBe("/auth/login?next=home"));
