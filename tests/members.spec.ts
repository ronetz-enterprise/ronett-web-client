import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  openAuthenticated,
  loginOnCurrentPage,
  switchOrganization,
} from "./auth-helper";
const org = "/app/00000000-0000-4000-8000-000000000001";
const other = "00000000-0000-4000-8000-000000000077";
test("OWNER reads settings and reloads the validated context", async ({
  page,
}) => {
  await openAuthenticated(page, org + "/settings/general");
  await expect(
    page.getByRole("heading", { name: "Paramètres de l’organisation" }),
  ).toBeVisible();
  await expect(page.getByText("XAF", { exact: true })).toBeVisible();
  await expect(page.getByText("Consultation uniquement")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Paramètres de l’organisation" }),
  ).toBeVisible();
});
test("OWNER filters members and confirms lifecycle transitions", async ({
  page,
}) => {
  await openAuthenticated(page, org + "/settings/members");
  await page.getByLabel("Rechercher un identifiant").fill("077");
  await expect(
    page.getByRole("row", { name: new RegExp(other) }),
  ).toBeVisible();
  for (const [action, status] of [
    ["Suspendre", "Suspendu"],
    ["Réactiver", "Actif"],
    ["Révoquer", "Révoqué"],
  ]) {
    await page.getByRole("button", { name: "Actions pour " + other }).click();
    await page.getByRole("menuitem", { name: action, exact: true }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Confirmer", exact: true }).click();
    await expect(
      page.getByRole("row", { name: new RegExp(other) }),
    ).toContainText(status);
  }
});
test("last OWNER stays protected and members remain accessible at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(org + "/settings/members");
  await loginOnCurrentPage(page, "last-owner@example.test");
  await page.getByRole("button", { name: /Actions pour/ }).click();
  await expect(
    page.getByRole("menuitem", { name: "Révoquer", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("menuitem", { name: "Suspendre", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("members of Org-A cannot be read through a foreign URL", async ({
  page,
}) => {
  await openAuthenticated(page, org + "/settings/members");
  await expect(page.getByText(other, { exact: true })).toBeVisible();
  await page.goto("/app/00000000-0000-4000-8000-000000000020/settings/members");
  await expect(
    page.getByRole("heading", { name: "Accès non autorisé" }),
  ).toBeVisible();
  await expect(page.getByText(other, { exact: true })).toBeHidden();
});
test("withdrawing own membership leaves the tenant immediately", async ({
  page,
}) => {
  await openAuthenticated(page, org + "/settings/members");
  await page
    .getByRole("button", {
      name: "Actions pour 00000000-0000-4000-8000-000000000099",
    })
    .click();
  await page.getByRole("menuitem", { name: "Révoquer", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toContainText("propre accès");
  await page.getByRole("button", { name: "Confirmer", exact: true }).click();
  await expect(page).toHaveURL("/organizations/select");
  await expect(
    page.getByRole("heading", { name: "Membres", exact: true }),
  ).toBeHidden();
});

test("switching organizations reloads isolated memberships and status filters", async ({
  page,
}) => {
  await page.goto(org + "/settings/members");
  await loginOnCurrentPage(page, "multi@example.test");
  await page.getByRole("button", { name: "Actions pour " + other }).click();
  await page.getByRole("menuitem", { name: "Suspendre", exact: true }).click();
  await page.getByRole("button", { name: "Confirmer", exact: true }).click();
  await expect(
    page.getByRole("row", { name: new RegExp(other) }),
  ).toContainText("Suspendu");
  // Les paramètres ont leur propre barre latérale : retour à l'espace pour changer d'organisation.
  await page
    .getByRole("link", { name: "Retour à l’espace", exact: true })
    .click();
  await switchOrganization(page, "Organisation B");
  await expect(page).toHaveURL("/app/00000000-0000-4000-8000-000000000002");
  await page.getByRole("link", { name: "Paramètres", exact: true }).click();
  await page.getByRole("link", { name: "Membres", exact: true }).click();
  await expect(
    page.getByRole("row", { name: new RegExp(other) }),
  ).toContainText("Actif");
  await expect(page.getByRole("table")).toHaveAccessibleName(
    "Appartenances de Organisation B",
  );
  await page.getByRole("combobox", { name: "Statut", exact: true }).click();
  await page.getByRole("option", { name: "Suspendu", exact: true }).click();
  await expect(page.getByText("Aucun résultat", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/status=SUSPENDED/);
  await page
    .getByRole("link", { name: "Retour à l’espace", exact: true })
    .click();
  await switchOrganization(page, "Organisation A");
  await expect(page).toHaveURL(org);
  await page.getByRole("link", { name: "Paramètres", exact: true }).click();
  await page.getByRole("link", { name: "Membres", exact: true }).click();
  await expect(
    page.getByRole("row", { name: new RegExp(other) }),
  ).toContainText("Suspendu");
});
