import { test, expect, type Page, type TestInfo } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loginOnCurrentPage } from "./auth-helper";
const org = "/app/00000000-0000-4000-8000-000000000001";
async function capture(page: Page, info: TestInfo, name: string) {
  await expect(page.locator("body")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath(name + ".png"),
    fullPage: true,
    animations: "disabled",
  });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
}
for (const width of [375, 768, 1280, 1440]) {
  for (const theme of ["light", "dark"] as const) {
    test(`reference views ${width}px ${theme}`, async ({ page }, info) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height: 960 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto(org);
      await expect(
        page.getByRole("button", { name: "Se connecter", exact: true }),
      ).toBeEnabled();
      await capture(page, info, "login");
      await loginOnCurrentPage(page);
      await expect(
        page.getByRole("heading", { name: "Tableau de bord" }),
      ).toBeVisible();
      await capture(page, info, "dashboard");
      const account = page.getByRole("button", { name: /compte utilisateur$/ });
      const toggle = page.getByRole("button", {
        name: "Basculer la navigation",
        exact: true,
      });
      await toggle.click();
      if (width < 768) {
        await expect(
          page.getByRole("dialog", { name: "Navigation" }),
        ).toBeVisible();
        // Le menu de compte est porte par le tiroir, pas par la barre haute.
        await expect(account).toBeVisible();
        await capture(page, info, "mobile-navigation");
        await page.keyboard.press("Escape");
        await expect(toggle).toBeFocused();
      } else {
        await expect(account).toBeVisible();
        await expect(
          page.locator('[data-slot="sidebar"]').first(),
        ).toHaveAttribute("data-state", "collapsed");
        await capture(page, info, "sidebar-collapsed");
        const settings = page
          .getByRole("navigation", { name: "Espace organisation" })
          .getByRole("link", {
            name: "Paramètres",
            exact: true,
          });
        await page.keyboard.press("Tab");
        await settings.focus();
        await expect(
          page
            .locator('[data-slot="tooltip-content"]')
            .filter({ hasText: /^Paramètres$/ }),
        ).toBeVisible();
        await toggle.click();
      }
      for (const [path, heading, shot] of [
        ["/organization", "Organisation", "detail"],
        ["/settings/general", "Paramètres de l’organisation", "settings"],
        ["/settings/members", "Membres", "members"],
      ]) {
        await page.goto(org + path);
        await expect(
          page.getByRole("heading", { name: heading, exact: true }),
        ).toBeVisible();
        if (shot === "settings")
          await expect(page.getByText("XAF", { exact: true })).toBeVisible();
        if (shot === "members")
          await expect(page.getByRole("table")).toBeVisible();
        await capture(page, info, shot);
      }
      await page
        .getByRole("button", { name: "Ajouter un utilisateur", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await capture(page, info, "dialog");
      await page.keyboard.press("Escape");
      await page.getByLabel("Rechercher un identifiant").fill("no-match");
      await expect(
        page.getByRole("heading", { name: "Aucun résultat" }),
      ).toBeVisible();
      await capture(page, info, "empty-search");
      await page.goto("/onboarding/organization");
      await expect(
        page.getByRole("heading", { name: "Créer une organisation" }),
      ).toBeVisible();
      await capture(page, info, "form");
      await page.goto("/missing-page");
      await expect(
        page.getByRole("heading", { name: "Page introuvable" }),
      ).toBeVisible();
      await capture(page, info, "error");
      await page.goto("/__dev/socle");
      await expect(
        page.getByRole("heading", { name: "Console Ronetz" }),
      ).toBeVisible();
      await capture(page, info, "reference");
    });
  }
}
