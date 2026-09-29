import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loginOnCurrentPage, openAuthenticated } from "./auth-helper";
test("zero organizations then creation confirms real OWNER and opens dashboard once", async ({
  page,
}) => {
  await page.goto("/auth/login");
  await loginOnCurrentPage(page, "zero@example.test");
  await expect(page).toHaveURL("/onboarding/organization");
  let creates = 0;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().endsWith("/api/organizations")
    ) {
      creates++;
      expect(request.headers()["idempotency-key"]).toBeTruthy();
    }
  });
  await page.getByLabel("Nom de l’organisation").fill("Fixture organisation");
  await page.getByLabel("Devise", { exact: true }).fill("xaf");
  await page
    .getByRole("button", { name: "Créer l’organisation", exact: true })
    .dblclick();
  await expect(
    page.getByRole("heading", { name: "Tableau de bord" }),
  ).toBeVisible();
  await expect(page.getByText("Fixture organisation · OWNER")).toBeVisible();
  expect(creates).toBe(1);
});
test("lost creation response recovers after reload using exactly the same intention", async ({
  page,
}) => {
  await openAuthenticated(page, "/onboarding/organization");
  const keys: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().endsWith("/api/organizations")
    )
      keys.push(request.headers()["idempotency-key"]);
  });
  await page.getByLabel("Nom de l’organisation").fill("Fixture lost");
  await page.getByLabel("Devise", { exact: true }).fill("XAF");
  await page
    .getByRole("button", { name: "Créer l’organisation", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Résultat de création inconnu" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Résultat de création inconnu" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Réessayer la vérification" }).click();
  await expect(
    page.getByRole("heading", { name: "Tableau de bord" }),
  ).toBeVisible();
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBe(keys[1]);
  await expect(page.getByText("Fixture lost · OWNER")).toBeVisible();
});
test("unknown outcome stays recoverable without allowing another creation", async ({
  page,
}) => {
  await openAuthenticated(page, "/onboarding/organization");
  await page.getByLabel("Nom de l’organisation").fill("Fixture server");
  await page.getByLabel("Devise", { exact: true }).fill("XAF");
  await page
    .getByRole("button", { name: "Créer l’organisation", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Résultat de création inconnu" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Réessayer la vérification" }).click();
  await expect(
    page.getByRole("heading", { name: "Résultat de création inconnu" }),
  ).toBeVisible();
  await expect(
    page.getByText("onboarding-fixture-correlation", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Créer l’organisation", exact: true }),
  ).toBeHidden();
});
test("rejects foreign tenant without reading its organization or revealing its name", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/organizations"))
      requests.push(request.url());
  });
  await openAuthenticated(page, "/app/00000000-0000-4000-8000-000000000020");
  await expect(
    page.getByRole("heading", { name: "Accès non autorisé" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Espace organisation" }),
  ).toBeHidden();
  expect(requests).toEqual([]);
});
test("multiple organizations offer a choice and switch URL and dashboard together", async ({
  page,
}) => {
  await page.goto("/auth/login");
  await loginOnCurrentPage(page, "multi@example.test");
  await expect(
    page.getByRole("heading", { name: "Mes organisations" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Organisation A", exact: true }).click();
  await expect(page.getByText("Organisation A · OWNER")).toBeVisible();
  await page.getByRole("combobox", { name: "Organisation active" }).click();
  await page
    .getByRole("option", { name: "Organisation B", exact: true })
    .click();
  await expect(page).toHaveURL("/app/00000000-0000-4000-8000-000000000002");
  await expect(page.getByText("Organisation B · OWNER")).toBeVisible();
  await expect(page.getByText("Organisation A · OWNER")).toBeHidden();
});
test("creation validates fields, maps currency rejection and works at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await openAuthenticated(page, "/onboarding/organization");
  await page
    .getByRole("button", { name: "Créer l’organisation", exact: true })
    .click();
  await expect(page.getByLabel("Nom de l’organisation")).toBeFocused();
  await page.getByLabel("Nom de l’organisation").fill("Fixture organisation");
  await page.getByLabel("Devise", { exact: true }).fill("ZZZ");
  await page
    .getByRole("button", { name: "Créer l’organisation", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Vérifiez les informations",
  );
  await page.getByLabel("Nom de l’organisation").fill("Fixture validation");
  await page.getByLabel("Devise", { exact: true }).fill("XAF");
  await page
    .getByRole("button", { name: "Créer l’organisation", exact: true })
    .click();
  await expect(page.getByLabel("Nom de l’organisation")).toBeFocused();
  await expect(
    page.getByText("Vérifiez ce champ.", { exact: true }),
  ).toBeVisible();
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

test("logout discards the creation receipt before another user's session", async ({
  page,
}) => {
  await openAuthenticated(page, "/onboarding/organization");
  await page
    .getByLabel("Nom de l’organisation")
    .fill("Previous account organization");
  await page.getByLabel("Devise", { exact: true }).fill("XAF");
  await page
    .getByRole("button", { name: "Créer l’organisation", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Tableau de bord" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ma session", exact: true }).click();
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page.getByText("Session serveur révoquée.")).toBeVisible();
  await loginOnCurrentPage(page, "next@example.test");
  await expect(
    page.getByRole("heading", { name: "Créer une organisation" }),
  ).toBeVisible();
  await expect(page.getByLabel("Nom de l’organisation")).toHaveValue("");
  await expect(
    page.getByText("Previous account organization", { exact: true }),
  ).toBeHidden();
});

for (const [field, value, message] of [
  ["membershipStatus", "REVOKED", "Votre accès a été retiré."],
  ["membershipStatus", "SUSPENDED", "Votre accès est suspendu."],
  ["organizationStatus", "SUSPENDED", "Cette organisation est suspendue."],
  ["organizationStatus", "CLOSED", "Cette organisation est fermée."],
] as const) {
  test(
    "revalidates " + field + " " + value + " on foreground return",
    async ({ page }) => {
      await openAuthenticated(
        page,
        "/app/00000000-0000-4000-8000-000000000001",
      );
      await expect(
        page.getByRole("heading", { name: "Tableau de bord" }),
      ).toBeVisible();
      await page.evaluate(
        async ({ field, value }) => {
          const fixturePath = "/src/shared/testing/tenant-fixtures.ts";
          const fixture = (await import(fixturePath)) as {
            fixtureRecord: (email: string) => {
              items: Record<string, unknown>[];
            };
            saveFixture: (email: string) => void;
          };
          fixture.fixtureRecord("test@example.test").items[0][field] = value;
          fixture.saveFixture("test@example.test");
          window.dispatchEvent(new Event("visibilitychange"));
        },
        { field, value },
      );
      await expect(page.getByText(message, { exact: true })).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Tableau de bord" }),
      ).toBeHidden();
      await expect(
        page.getByRole("navigation", { name: "Espace organisation" }),
      ).toBeHidden();
    },
  );
}
test("a list loading failure does not redirect to empty onboarding", async ({
  page,
}) => {
  await page.goto("/auth/login");
  await loginOnCurrentPage(page, "list-error@example.test");
  await expect(page.getByRole("alert")).toContainText(
    "temporairement indisponible",
  );
  await expect(
    page.getByRole("heading", { name: "Créer une organisation" }),
  ).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Réessayer", exact: true }),
  ).toBeVisible();
});
