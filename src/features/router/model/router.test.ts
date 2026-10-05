import { describe, expect, it } from "vitest";
import { membershipSchema } from "@/features/memberships";
import { membership, orgA } from "@/shared/testing/tenant-fixtures";
import {
  isTrackingState,
  routerCapabilities,
  routerSchema,
  setupStage,
} from "./router";
import type { Router } from "./router";

const active = membershipSchema.parse(membership(orgA));
const base: Router = {
  id: "3f6c1f5e-0f3a-4a1e-9c0f-2b7d1e4a9c10",
  organizationId: orgA,
  siteId: null,
  name: "Routeur",
  vendor: "MikroTik",
  model: "hAP ax2",
  lifecycleStatus: "ACTIVE",
  provisioningStatus: "REGISTERED",
  connectivityStatus: "ONLINE",
  provisioningOperationId: "op-1",
  configurationArtifactId: "artifact-1",
  failureCode: null,
  pendingAction: null,
  lastSeenAt: null,
  createdAt: "2026-09-01T10:00:00+00:00",
  updatedAt: "2026-09-01T10:00:00+00:00",
};
const commands = [
  "provision",
  "artifact",
  "suspend",
  "resume",
  "revoke",
] as const;
const allowed = (router: Router, member = active) => {
  const caps = routerCapabilities(member, router, null);
  return commands.filter((action) => caps[action]);
};

describe("routerSchema", () => {
  it("valide pendingAction et refuse une action inconnue", () => {
    expect(routerSchema.parse({ ...base, pendingAction: "SUSPEND" })).toEqual(
      expect.objectContaining({ pendingAction: "SUSPEND" }),
    );
    expect(
      routerSchema.safeParse({ ...base, pendingAction: "REBOOT" }).success,
    ).toBe(false);
    const withoutPending: Partial<Router> = { ...base };
    delete withoutPending.pendingAction;
    expect(routerSchema.safeParse(withoutPending).success).toBe(false);
  });
});

describe("routerCapabilities", () => {
  it("désactive toutes les commandes tant qu'une action est en attente", () => {
    expect(allowed(base)).toEqual(["artifact", "suspend", "revoke"]);
    for (const pendingAction of [
      "PROVISION",
      "ARTIFACT",
      "SUSPEND",
      "RESUME",
      "REVOKE",
    ] as const)
      expect(allowed({ ...base, pendingAction })).toEqual([]);
    expect(
      allowed({
        ...base,
        lifecycleStatus: "SUSPENDED",
        pendingAction: "SUSPEND",
      }),
    ).toEqual([]);
    expect(
      allowed({ ...base, lifecycleStatus: "SUSPENDED", pendingAction: null }),
    ).toEqual(["resume", "revoke"]);
  });
  it("n'autorise le téléchargement qu'au propriétaire d'un artefact courant", () => {
    const download = (router: Router, member = active) =>
      routerCapabilities(member, router, null).download;
    expect(download(base)).toBe(true);
    expect(download({ ...base, pendingAction: "ARTIFACT" })).toBe(true);
    expect(
      download({ ...base, provisioningStatus: "PENDING_ENROLLMENT" }),
    ).toBe(true);
    expect(download({ ...base, configurationArtifactId: null })).toBe(false);
    expect(download({ ...base, lifecycleStatus: "SUSPENDED" })).toBe(false);
    expect(download({ ...base, lifecycleStatus: "REVOKED" })).toBe(false);
    expect(download({ ...base, provisioningStatus: "REVOKING" })).toBe(false);
    expect(download({ ...base, organizationId: crypto.randomUUID() })).toBe(
      false,
    );
    expect(download(base, { ...active, organizationStatus: "SUSPENDED" })).toBe(
      false,
    );
  });
});

describe("isTrackingState", () => {
  it("suit un routeur stable tant qu'une action reste à confirmer", () => {
    const suspended = { ...base, lifecycleStatus: "SUSPENDED" } as const;
    expect(isTrackingState(suspended)).toBe(false);
    expect(isTrackingState({ ...suspended, pendingAction: "SUSPEND" })).toBe(
      true,
    );
  });
});

describe("setupStage", () => {
  it("suit le parcours de l'ajout jusqu'au premier signal", () => {
    const fresh = {
      ...base,
      provisioningStatus: "NOT_REQUESTED",
      connectivityStatus: "UNKNOWN",
    } as const;
    expect(setupStage(fresh)).toEqual({ step: 1, state: "todo" });
    expect(setupStage({ ...fresh, pendingAction: "PROVISION" })).toEqual({
      step: 1,
      state: "running",
    });
    expect(setupStage({ ...fresh, provisioningStatus: "FAILED" })).toEqual({
      step: 1,
      state: "failed",
    });
    expect(
      setupStage({ ...fresh, provisioningStatus: "PENDING_ENROLLMENT" }),
    ).toEqual({ step: 2 });
    expect(setupStage({ ...fresh, provisioningStatus: "REGISTERED" })).toEqual({
      step: 3,
    });
    expect(setupStage(base)).toBeNull();
  });
  it("laisse à la supervision un routeur déjà vu ou hors cycle actif", () => {
    expect(
      setupStage({
        ...base,
        connectivityStatus: "OFFLINE",
        lastSeenAt: "2026-09-02T10:00:00+00:00",
      }),
    ).toBeNull();
    expect(
      setupStage({
        ...base,
        lifecycleStatus: "SUSPENDED",
        provisioningStatus: "NOT_REQUESTED",
      }),
    ).toBeNull();
  });
});
