import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { SettingsBody, SettingsSection } from "./settings-layout";

it("SettingsBody renders anchored sections without an on-page contents nav", () => {
  render(
    <SettingsBody>
      <SettingsSection id="connexion" title="Connexion">
        <p>Contenu</p>
      </SettingsSection>
      <SettingsSection id="references" title="Références">
        <p>Contenu</p>
      </SettingsSection>
    </SettingsBody>,
  );
  expect(screen.getByRole("region", { name: "Connexion" }).id).toBe(
    "connexion",
  );
  expect(screen.queryByRole("navigation", { name: "Sur cette page" })).toBe(
    null,
  );
});
