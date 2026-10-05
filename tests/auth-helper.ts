import { expect, type Page } from "@playwright/test";
export async function loginOnCurrentPage(
  page: Page,
  email = "test@example.test",
) {
  await expect(
    page.getByRole("heading", { name: "Connexion", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("Fixture-pass-123");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
}
export async function openAuthenticated(page: Page, destination: string) {
  await page.goto(destination);
  await loginOnCurrentPage(page);
  await expect(page).toHaveURL(destination);
}

/**
 * Declencheur du menu de pied de barre laterale (compte). Son nom accessible
 * reprend le nom de l'utilisateur, suivi d'un suffixe stable.
 */
export function accountMenu(page: Page) {
  return page.getByRole("button", { name: /compte utilisateur$/ });
}

/** Selecteur d'organisation en tete de barre laterale. */
export function organizationMenu(page: Page) {
  return page.getByRole("button", { name: /changer d'organisation$/ });
}

export async function switchOrganization(page: Page, name: string) {
  await organizationMenu(page).click();
  await page.getByRole("menuitemradio", { name, exact: true }).click();
}
