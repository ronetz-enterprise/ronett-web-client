import { describe, expect, it } from "vitest";
import type { Router } from "../model/router";
import { setupComplete } from "../model/router";
import { provisioningSteps } from "./router-details";

const base: Router = {
  id: "3f6c1f5e-0f3a-4a1e-9c0f-2b7d1e4a9c10",
  organizationId: "3f6c1f5e-0f3a-4a1e-9c0f-2b7d1e4a9c11",
  siteId: null,
  name: "Routeur",
  vendor: "MikroTik",
  model: "hAP ax2",
  lifecycleStatus: "ACTIVE",
  provisioningStatus: "NOT_REQUESTED",
  connectivityStatus: "UNKNOWN",
  provisioningOperationId: null,
  configurationArtifactId: null,
  failureCode: null,
  pendingAction: null,
  lastSeenAt: null,
  createdAt: "2026-09-01T10:00:00+00:00",
  updatedAt: "2026-09-01T10:00:00+00:00",
};
const states = (router: Router) =>
  Object.fromEntries(provisioningSteps(router).map((s) => [s.id, s.state]));

describe("provisioningSteps", () => {
  it("ne valide que la déclaration d'un routeur neuf", () => {
    expect(states(base)).toEqual({
      declared: "complete",
      provisioning: "current",
      enrollment: "upcoming",
      registered: "upcoming",
      online: "upcoming",
    });
  });
  it("marque l'installation comme étape courante une fois le script prêt", () => {
    expect(
      states({ ...base, provisioningStatus: "PENDING_ENROLLMENT" }),
    ).toMatchObject({ provisioning: "complete", enrollment: "current" });
  });
  it("atteint « en ligne » seulement pour un routeur enregistré et observé", () => {
    const router = {
      ...base,
      provisioningStatus: "REGISTERED",
      connectivityStatus: "ONLINE",
      lastSeenAt: "2026-09-02T10:00:00+00:00",
    } as const;
    expect(provisioningSteps(router).every((s) => s.state === "complete")).toBe(
      true,
    );
    expect(provisioningSteps(router).at(-1)?.at).toBe(router.lastSeenAt);
    expect(setupComplete(router)).toBe(true);
  });
  it("signale l'échec sur l'étape d'installation", () => {
    expect(states({ ...base, provisioningStatus: "FAILED" }).provisioning).toBe(
      "error",
    );
  });
  it("garde la mise en service visible tant que le routeur n'a jamais été vu", () => {
    expect(setupComplete({ ...base, provisioningStatus: "REGISTERED" })).toBe(
      false,
    );
    expect(
      setupComplete({
        ...base,
        provisioningStatus: "REGISTERED",
        connectivityStatus: "OFFLINE",
        lastSeenAt: "2026-09-02T10:00:00+00:00",
      }),
    ).toBe(true);
  });
});
