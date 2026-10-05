import { describe, expect, it } from "vitest";
import type { Router } from "../model/router";
import { matchesSearch, sortRouters } from "./router-directory";

const base: Router = {
  id: "3f6c1f5e-0f3a-4a1e-9c0f-2b7d1e4a9c10",
  organizationId: "3f6c1f5e-0f3a-4a1e-9c0f-2b7d1e4a9c11",
  siteId: null,
  name: "Terrasse",
  vendor: "MikroTik",
  model: "hAP ax2",
  lifecycleStatus: "ACTIVE",
  provisioningStatus: "REGISTERED",
  connectivityStatus: "ONLINE",
  provisioningOperationId: null,
  configurationArtifactId: null,
  failureCode: null,
  pendingAction: null,
  lastSeenAt: null,
  createdAt: "2026-09-01T10:00:00+00:00",
  updatedAt: "2026-09-01T10:00:00+00:00",
};
const a = {
  ...base,
  id: "a",
  name: "Terrasse",
  lastSeenAt: "2026-09-02T10:00:00+00:00",
};
const b = { ...base, id: "b", name: "Accueil", lastSeenAt: null };
const c = {
  ...base,
  id: "c",
  name: "Bar",
  lastSeenAt: "2026-09-03T10:00:00+00:00",
};
const sites: Record<string, string> = { a: "Zinc", b: "Café", c: "Café" };
const ids = (routers: Router[]) => routers.map((router) => router.id);

describe("liste des routeurs", () => {
  it("cherche dans le nom, le constructeur et le modèle", () => {
    expect(matchesSearch(base, "terr")).toBe(true);
    expect(matchesSearch(base, "mikrotik")).toBe(true);
    expect(matchesSearch(base, "AX2")).toBe(true);
    expect(matchesSearch(base, "rb4011")).toBe(false);
    expect(matchesSearch(base, "  ")).toBe(true);
  });
  it("garde l'ordre du backend pour la date d'ajout", () => {
    expect(ids(sortRouters([a, b, c], "created", () => ""))).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
  it("trie par nom, par site puis nom, et par dernier signal", () => {
    const site = (router: Router) => sites[router.id];
    expect(ids(sortRouters([a, b, c], "name", site))).toEqual(["b", "c", "a"]);
    expect(ids(sortRouters([a, b, c], "site", site))).toEqual(["b", "c", "a"]);
    // Le plus récent d'abord ; un routeur jamais vu passe en dernier.
    expect(ids(sortRouters([a, b, c], "seen", site))).toEqual(["c", "a", "b"]);
  });
});
