import { describe, expect, it } from "vitest";
import { validityUsage, type AccessGrant } from "./access-grant";

const grant = (patch: Partial<AccessGrant>) =>
  ({
    activatedAt: "2026-09-01T00:00:00+00:00",
    expiresAt: "2026-09-02T00:00:00+00:00",
    ...patch,
  }) as AccessGrant;

describe("validityUsage", () => {
  it("mesure la part écoulée entre activation et expiration", () => {
    const usage = validityUsage(grant({}), Date.parse("2026-09-01T06:00:00Z"));
    expect(usage && usage.elapsed / usage.total).toBe(0.25);
  });
  it("plafonne après l'expiration", () => {
    const usage = validityUsage(grant({}), Date.parse("2026-09-05T00:00:00Z"));
    expect(usage && usage.elapsed / usage.total).toBe(1);
  });
  it("ne mesure rien sans activation", () => {
    expect(validityUsage(grant({ activatedAt: null }))).toBeNull();
  });
});
