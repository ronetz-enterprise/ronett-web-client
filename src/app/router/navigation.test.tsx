import { describe, expect, it } from "vitest";
import {
  isSettingsPath,
  navigationFor,
  settingsNavigationFor,
} from "./navigation";

const org = "00000000-0000-4000-8000-000000000001";

describe("barre latérale des paramètres", () => {
  it("ne bascule que sous /settings de l'organisation", () => {
    expect(isSettingsPath(org, `/app/${org}/settings`)).toBe(true);
    expect(isSettingsPath(org, `/app/${org}/settings/members`)).toBe(true);
    expect(isSettingsPath(org, `/app/${org}/sites/1/settings`)).toBe(false);
    expect(isSettingsPath(org, `/app/${org}/settingsx`)).toBe(false);
    expect(isSettingsPath(undefined, `/app/${org}/settings`)).toBe(false);
  });
  it("propose Général et Membres, chacun soumis à sa permission", () => {
    expect(
      settingsNavigationFor(org).map((item) => [item.title, item.permission]),
    ).toEqual([
      ["Général", "ORGANIZATION_READ"],
      ["Membres", "MEMBERSHIP_READ"],
    ]);
  });
  it("garde l'entrée Paramètres de la navigation principale", () => {
    expect(navigationFor(org).some((item) => item.title === "Paramètres")).toBe(
      true,
    );
  });
});
