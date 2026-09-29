import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loginOnCurrentPage, openAuthenticated } from "./auth-helper";
const org = "/app/00000000-0000-4000-8000-000000000001";
test("registration follows the contract and requires a separate login", async ({
  page,
}) => {
  await page.goto("/auth/register");
  await page.getByLabel("Prénom").fill("Test");
  await page.getByLabel("Nom", { exact: true }).fill("Fixture");
  await page.getByLabel("Email").fill("new@example.test");
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("Fixture-pass-123");
  await page
    .getByLabel("Confirmation du mot de passe")
    .fill("Fixture-pass-123");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByRole("status")).toContainText("Compte créé");
  await loginOnCurrentPage(page, "new@example.test");
  await expect(page).toHaveURL("/onboarding/organization");
  await expect(
    page.getByRole("heading", { name: "Créer une organisation" }),
  ).toBeVisible();
});
test("invalid credentials retain email without revealing account existence", async ({
  page,
}) => {
  await page.goto("/auth/login");
  await page.getByLabel("Email").fill("test@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Connexion impossible avec ces identifiants.",
  );
  await expect(page.getByLabel("Email")).toHaveValue("test@example.test");
  await expect(page.getByLabel("Mot de passe", { exact: true })).toHaveValue(
    "",
  );
});
test("restores the session and revalidates the tenant after reload", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await openAuthenticated(page, org);
  await expect(
    page.getByRole("heading", { name: "Tableau de bord" }),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(org);
  await expect(
    page.getByRole("heading", { name: "Tableau de bord" }),
  ).toBeVisible();
  expect(requests.some((url) => url.endsWith("/api/auth/web/refresh"))).toBe(
    true,
  );
  expect(
    requests.filter((url) =>
      url.endsWith("/api/me/memberships/00000000-0000-4000-8000-000000000001"),
    ).length,
  ).toBeGreaterThanOrEqual(2);
  const stored = await page.evaluate(() =>
    JSON.stringify({ ...localStorage, ...sessionStorage }),
  );
  expect(stored).not.toMatch(/accessToken|refreshToken|Fixture-pass/);
});
test("external return URLs are discarded", async ({ page }) => {
  await page.goto("/auth/login?returnTo=https%3A%2F%2Fevil.example");
  await loginOnCurrentPage(page);
  await expect(page).toHaveURL(org);
});
test("expired refresh cleans the session and offers a safe return", async ({
  page,
}) => {
  await page.goto(org);
  await loginOnCurrentPage(page, "expired@example.test");
  await expect(
    page.getByRole("heading", { name: "Tableau de bord" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Session terminée" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Se reconnecter" }).click();
  await loginOnCurrentPage(page);
  await expect(page).toHaveURL(org);
});
test("logout revokes server session and back navigation cannot reveal protected content", async ({
  page,
}) => {
  await openAuthenticated(page, "/account");
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page.getByText("Session serveur révoquée.")).toBeVisible();
  await page.goBack();
  await page.goto("/account");
  await expect(
    page.getByRole("heading", { name: "Connexion", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ma session", exact: true }),
  ).toBeHidden();
});
test("failed server logout still clears locally and reports revocation uncertainty", async ({
  page,
}) => {
  await page.goto("/account");
  await loginOnCurrentPage(page, "logout-failure@example.test");
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "révocation de la session serveur n’a pas pu être confirmée",
  );
});
test("platform permissions are not invented", async ({ page }) => {
  await page.goto("/platform-admin");
  await loginOnCurrentPage(page);
  await expect(page).toHaveURL(org);
  await page.goto("/platform-admin");
  await expect(
    page.getByRole("heading", { name: "Accès interdit" }),
  ).toBeVisible();
});
test("auth forms support keyboard, errors, password reveal and mobile 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of ["/auth/login", "/auth/register"]) {
    await page.goto(path);
    const submit = page.getByRole("button", {
      name: path.endsWith("login") ? "Se connecter" : "Créer mon compte",
    });
    await submit.click();
    await expect(
      page.getByLabel(path.endsWith("login") ? "Email" : "Prénom", {
        exact: true,
      }),
    ).toBeFocused();
    const password = page.getByLabel("Mot de passe", { exact: true });
    await password.fill("Fixture-pass-123");
    await page
      .getByRole("button", { name: "Afficher mot de passe", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(password).toHaveAttribute("type", "text");
    await page.keyboard.press("Enter");
    await expect(password).toHaveAttribute("type", "password");
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
  }
});
