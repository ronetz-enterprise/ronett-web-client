import { test, expect } from "@playwright/test";
const org = "/app/00000000-0000-4000-8000-000000000001";
test("starts the app and navigates across organization placeholders", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle("Ronet");
  await page
    .getByRole("link", { name: "Aperçu de l’espace organisation" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Tableau de bord" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Espace organisation" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Espace organisation" })
    .getByRole("link", { name: "Organisation", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Organisation", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Espace organisation" })
      .getByRole("link", { name: "Organisation", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page
    .getByRole("button", { name: "Basculer la navigation", exact: true })
    .first()
    .click();
  await expect(page.locator('[data-slot="sidebar"]').first()).toHaveAttribute(
    "data-state",
    "collapsed",
  );
  await page
    .getByRole("button", { name: "Basculer la navigation", exact: true })
    .first()
    .click();
  await expect(page.locator('[data-slot="sidebar"]').first()).toHaveAttribute(
    "data-state",
    "expanded",
  );
  expect(
    await page.evaluate(() => ({
      local: { ...localStorage },
      session: { ...sessionStorage },
    })),
  ).toEqual({ local: {}, session: {} });
  expect(errors).toEqual([]);
});
for (const [path, title] of [
  ["/public", "Portail Wi-Fi"],
  ["/auth/login", "Connexion"],
  ["/auth/register", "Inscription"],
  ["/onboarding", "Bienvenue dans votre organisation"],
  ["/platform-admin", "Administration plateforme"],
  ["/missing-page", "Page introuvable"],
]) {
  test(`route ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    if (path === "/missing-page") expect(response?.status()).toBe(404);
  });
}
test("mobile navigation opens, closes and follows links at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(org);
  const toggle = page.getByRole("button", { name: "Basculer la navigation" });
  await toggle.click();
  await expect(page.getByRole("dialog", { name: "Navigation" })).toBeVisible();
  await page.getByRole("button", { name: "Fermer", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await toggle.click();
  await page
    .getByRole("navigation", { name: "Espace organisation" })
    .getByRole("link", { name: "Organisation", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Organisation", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("keyboard navigation, tablet and reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(org);
  await expect(
    page.getByRole("button", { name: "Basculer la navigation" }),
  ).toBeEnabled();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Aller au contenu" }),
  ).toBeFocused();
  await page.keyboard.press("Control+b");
  await expect(page.locator('[data-slot="sidebar"]').first()).toHaveAttribute(
    "data-state",
    "collapsed",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("MSW ProblemDetail, correlation copy and accessible form", async ({
  page,
  browserName,
}) => {
  if (browserName !== "chromium") {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            document.documentElement.dataset.copied = text;
          },
        },
      });
    });
  }
  await page.goto("/__dev/socle");
  await page
    .getByRole("button", { name: "Simuler une erreur technique" })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "temporairement indisponible",
  );
  await expect(
    page.getByText("sprint-1-correlation", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Copier la référence" }).click();
  await expect(page.getByText("Référence copiée.")).toBeVisible();
  const copied =
    browserName === "chromium"
      ? await page.evaluate(() => navigator.clipboard.readText())
      : await page.evaluate(() => document.documentElement.dataset.copied);
  expect(copied).toBe("sprint-1-correlation");
  await page.getByRole("button", { name: "Valider", exact: true }).click();
  await expect(page.getByLabel("Libellé de test")).toBeFocused();
  await page.getByLabel("Libellé de test").fill("Test");
  await page.getByRole("button", { name: "Valider", exact: true }).click();
  await expect(page.getByText("Validation réussie.")).toBeVisible();
  await page.getByRole("button", { name: "Tester la confirmation" }).click();
  await expect(
    page.getByRole("dialog", { name: "Confirmer le test" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
});
