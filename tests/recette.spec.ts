import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { loginOnCurrentPage } from "./auth-helper";

/**
 * Recette finale (Lot 9) : une page représentative par gabarit, sur les données déterministes
 * de `src/shared/testing/operations-handlers.ts`. L'horloge est figée sur la même date que ces
 * données (`FIXTURE_NOW`) pour que les temps relatifs et graphiques soient stables.
 *
 * Première exécution ou changement validé : `npx playwright test recette --update-snapshots`.
 */
const FIXTURE_NOW = new Date("2026-09-15T10:00:00.000Z");
const org = "/app/00000000-0000-4000-8000-000000000001";
const site = "10000000-0000-4000-8000-000000000001";

const pages = [
  { name: "tableau-de-bord", path: org, heading: /Bonjour|Tableau de bord/ },
  { name: "sites-liste", path: `${org}/sites`, heading: "Sites" },
  {
    name: "site-detail",
    path: `${org}/sites/${site}`,
    heading: "Café du Port",
  },
  {
    name: "site-offres",
    path: `${org}/sites/${site}/offers`,
    heading: "Café du Port",
  },
  { name: "routeurs", path: `${org}/routers`, heading: "Routeurs" },
  {
    name: "routeur-detail",
    path: `${org}/routers/20000000-0000-4000-8000-000000000001`,
    heading: "Salle principale",
  },
  { name: "acces", path: `${org}/access`, heading: "Accès Internet" },
  {
    name: "acces-detail",
    path: `${org}/access/40000000-0000-4000-8000-000000000001`,
    heading: /Droit d’accès/,
  },
  {
    name: "consommation",
    path: `${org}/usage`,
    heading: "Consommation réseau",
  },
  { name: "finances", path: `${org}/finance`, heading: "Finances" },
  {
    name: "parametres",
    path: `${org}/settings/general`,
    heading: "Paramètres",
  },
  { name: "compte", path: "/account", heading: "Mon compte" },
] as const;

const publicPages = [
  { name: "accueil", path: "/", heading: "Vendez votre WiFi, simplement." },
  { name: "connexion", path: "/auth/login", heading: "Connexion" },
  {
    name: "portail",
    path: `/connect/${site}`,
    heading: "Choisissez votre accès Internet",
  },
] as const;

async function prepare(page: Page) {
  await page.clock.setFixedTime(FIXTURE_NOW);
  // Captures stables : aucune animation, quel que soit le composant.
  await page.emulateMedia({ reducedMotion: "reduce" });
}

/** Ouvre la page ; se connecte seulement si la session n'a pas pu être restaurée. */
async function open(page: Page, path: string, authenticated = true) {
  await page.goto(path);
  if (!authenticated) return;
  const login = page.getByRole("heading", { name: "Connexion", exact: true });
  const content = page.locator("#main-content, main");
  await expect(login.or(content).first()).toBeVisible();
  if (await login.isVisible()) {
    await loginOnCurrentPage(page);
    await expect(page).toHaveURL(path);
  }
}

async function expectAccessible(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
}

for (const [group, list, authenticated] of [
  ["console", pages, true],
  ["public", publicPages, false],
] as const) {
  for (const target of list) {
    test.describe(`${group} · ${target.name}`, () => {
      test.skip(
        ({ browserName }) => browserName !== "chromium",
        "Références visuelles et axe sur Chromium uniquement.",
      );

      test("accessible en clair et en sombre", async ({ page }) => {
        await prepare(page);
        await open(page, target.path, authenticated);
        await expect(
          page.getByRole("heading", { level: 1, name: target.heading }),
        ).toBeVisible();
        for (const colorScheme of ["light", "dark"] as const) {
          await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
          await expectAccessible(page);
        }
      });

      test("conforme aux captures de référence", async ({ page }) => {
        await prepare(page);
        for (const width of [375, 1280]) {
          await page.setViewportSize({ width, height: 900 });
          await open(page, target.path, authenticated);
          await expect(
            page.getByRole("heading", { level: 1, name: target.heading }),
          ).toBeVisible();
          // Aucun défilement horizontal, y compris sur téléphone.
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= window.innerWidth,
            ),
          ).toBe(true);
          for (const colorScheme of ["light", "dark"] as const) {
            await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
            await expect(page).toHaveScreenshot(
              `${target.name}-${colorScheme}-${width}.png`,
              {
                fullPage: true,
                animations: "disabled",
                maxDiffPixelRatio: 0.01,
              },
            );
          }
        }
      });
    });
  }
}

test("mouvement réduit : plus aucune animation ne tourne", async ({ page }) => {
  await prepare(page);
  for (const path of [org, `${org}/routers`, `${org}/finance`]) {
    await open(page, path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForLoadState("networkidle");
    const running = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((animation) => {
          const timing = animation.effect?.getComputedTiming();
          return (
            animation.playState === "running" &&
            Number(timing?.duration ?? 0) > 1
          );
        })
        .map((animation) => String(animation.constructor.name)),
    );
    expect(running, path).toEqual([]);
  }
});

test("navigation clavier : chaque lien de la barre latérale est atteignable", async ({
  page,
}) => {
  await prepare(page);
  await open(page, org);
  const nav = page.getByRole("navigation", { name: "Espace organisation" });
  const links = await nav.getByRole("link").count();
  expect(links).toBeGreaterThan(5);
  const reached = new Set<string>();
  for (let i = 0; i < 40 && reached.size < links; i += 1) {
    await page.keyboard.press("Tab");
    const label = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.closest('nav[aria-label="Espace organisation"]')
        ? (el.textContent ?? "").trim()
        : null;
    });
    if (label) reached.add(label);
  }
  expect(reached.size).toBe(links);
});
