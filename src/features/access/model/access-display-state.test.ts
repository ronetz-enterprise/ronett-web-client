import { describe, expect, it } from "vitest";
import type { Membership } from "@/features/memberships";
import { accessPermissions } from "../permissions/access-permissions";
import { accessDisplayState, type AccessGrant } from "./access-grant";

const organizationId = "3f6c1f5e-0f3a-4a1e-9c0f-2b7d1e4a9c10";
const grant = (status: string, projectionStatus: string) =>
  ({ organizationId, status, projectionStatus }) as AccessGrant;
const owner = {
  organizationId,
  role: "OWNER",
  membershipStatus: "ACTIVE",
  organizationStatus: "ACTIVE",
} as Membership;

describe("accès dont le réseau n'a pas pu être mis à jour", () => {
  it("montre l'état réel d'une restriction pas encore appliquée", () => {
    expect(accessDisplayState(grant("SUSPENDED", "FAILED"))).toEqual({
      label: "Suspendu · réseau pas à jour",
      tone: "warning",
      usable: false,
    });
    expect(accessDisplayState(grant("REVOKED", "FAILED")).label).toBe(
      "Annulé · réseau pas à jour",
    );
  });
  it("garde « Problème d’activation » pour un accès en cours de création", () => {
    expect(accessDisplayState(grant("ACTIVE", "FAILED")).label).toBe(
      "Problème d’activation",
    );
  });
  it("laisse annuler l'accès malgré l'échec, mais pas suspendre ni reprendre", () => {
    const suspended = accessPermissions(owner, grant("SUSPENDED", "FAILED"));
    expect(suspended.canRevokeAccess).toBe(true);
    expect(suspended.canResumeAccess).toBe(false);
    expect(suspended.canRetryProvisioning).toBe(true);
    expect(
      accessPermissions(owner, grant("ACTIVE", "FAILED")).canSuspendAccess,
    ).toBe(false);
  });
  it("n'annule pas un accès déjà terminé", () => {
    expect(
      accessPermissions(owner, grant("REVOKED", "FAILED")).canRevokeAccess,
    ).toBe(false);
  });
});
