import { test, expect, request as playwrightRequest } from "@playwright/test";
test("real cookies, CSRF, OWNER, reload, foreign denial, safe replay and revocation", async ({
  page,
}) => {
  const api = "http://localhost:8081";
  const suffix = crypto.randomUUID();
  const email = "frontend-" + suffix + "@example.test";
  const password = "Qualification-" + crypto.randomUUID();
  const other = await playwrightRequest.newContext({ baseURL: api });
  const register = async (address: string) => {
    const response = await other.post("/api/auth/register", {
      data: {
        email: address,
        password,
        firstName: "Frontend",
        lastName: "Qualification",
      },
    });
    expect(response.status()).toBe(201);
  };
  await register(email);
  const otherEmail = "foreign-" + suffix + "@example.test";
  await register(otherEmail);
  const csrf = (await (await other.get("/api/auth/web/csrf")).json()) as {
    headerName: string;
    token: string;
  };
  expect(
    (
      await other.post("/api/auth/web/login", {
        data: { email: otherEmail, password },
      })
    ).status(),
  ).toBe(403);
  const login = await other.post("/api/auth/web/login", {
    headers: { [csrf.headerName]: csrf.token },
    data: { email: otherEmail, password },
  });
  expect(login.status()).toBe(200);
  const token = (await login.json()) as { accessToken: string };
  const foreign = await other.post("/api/organizations", {
    headers: {
      Authorization: "Bearer " + token.accessToken,
      "Idempotency-Key": crypto.randomUUID(),
    },
    data: { name: "Foreign qualification " + suffix, currency: "XAF" },
  });
  expect(foreign.status()).toBe(201);
  const foreignOrg = (await foreign.json()) as { id: string };
  await page.goto("/auth/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  const authenticated = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/auth/web/login") &&
      r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  const access = (await (await authenticated).json()) as {
    accessToken: string;
  };
  await expect(
    page.getByRole("heading", { name: "Créer une organisation" }),
  ).toBeVisible();
  await page
    .getByLabel("Nom de l’organisation")
    .fill("Qualification A " + suffix);
  await page.getByLabel("Devise", { exact: true }).fill("XAF");
  await page
    .getByRole("button", { name: "Créer l’organisation", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Tableau de bord" }),
  ).toBeVisible();
  const orgA = page.url().split("/app/")[1];
  const cookies = await page.context().cookies(api + "/api/auth/web/refresh");
  const cookie = cookies.find((c) => c.name === "ronetz_refresh");
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Strict");
  expect(cookie?.path).toBe("/api/auth/web");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Tableau de bord" }),
  ).toBeVisible();
  await page.goto("/app/" + foreignOrg.id);
  await expect(
    page.getByRole("heading", { name: "Accès non autorisé" }),
  ).toBeVisible();
  await expect(
    page.getByText("Foreign qualification " + suffix, { exact: true }),
  ).toBeHidden();
  for (const path of [
    "/api/organizations/" + foreignOrg.id,
    "/api/organizations/" + foreignOrg.id + "/memberships",
  ]) {
    const response = await other.get(path, {
      headers: { Authorization: "Bearer " + access.accessToken },
    });
    expect(response.status()).toBe(403);
    const problem = (await response.json()) as { code: string };
    expect(problem.code).toBe("ORGANIZATION_ACCESS_DENIED");
  }
  await page.goto("/onboarding/organization");
  let posts = 0;
  const keys: string[] = [];
  await page.route(api + "/api/organizations", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    posts++;
    keys.push(route.request().headers()["idempotency-key"]);
    if (posts === 1) {
      const committed = await route.fetch();
      expect(committed.status()).toBe(201);
      await route.abort("failed");
    } else await route.continue();
  });
  await page
    .getByLabel("Nom de l’organisation")
    .fill("Qualification recovered " + suffix);
  await page.getByLabel("Devise", { exact: true }).fill("EUR");
  await page
    .getByRole("button", { name: "Créer l’organisation", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Résultat de création inconnu" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Réessayer la vérification" }).click();
  await expect(
    page.getByRole("heading", { name: "Tableau de bord" }),
  ).toBeVisible();
  expect(posts).toBe(2);
  expect(keys[0] === keys[1]).toBe(true);
  await page.getByRole("combobox", { name: "Organisation active" }).click();
  await page
    .getByRole("option", { name: "Qualification A " + suffix, exact: true })
    .click();
  await expect(
    page.getByText("Qualification A " + suffix + " · OWNER"),
  ).toBeVisible();
  const me = (await (
    await other.get("/api/me", {
      headers: { Authorization: "Bearer " + access.accessToken },
    })
  ).json()) as { userId: string };
  const remainingOwner = (await (
    await other.get("/api/me", {
      headers: { Authorization: "Bearer " + token.accessToken },
    })
  ).json()) as { userId: string };
  await page.goto("/app/" + orgA + "/settings/general");
  await expect(page.getByText("XAF", { exact: true })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Espace organisation" })
    .getByRole("link", { name: "Membres", exact: true })
    .click();
  await page.getByRole("button", { name: "Ajouter un utilisateur" }).click();
  await page.getByLabel("Identifiant utilisateur").fill(remainingOwner.userId);
  await page.getByRole("button", { name: "Ajouter comme OWNER" }).click();
  await expect(
    page.getByText(remainingOwner.userId, { exact: true }),
  ).toBeVisible();
  const forbiddenMutation = await other.patch(
    "/api/organizations/" +
      foreignOrg.id +
      "/memberships/" +
      remainingOwner.userId +
      "/suspension",
    { headers: { Authorization: "Bearer " + access.accessToken } },
  );
  expect(forbiddenMutation.status()).toBe(403);
  for (const [action, status] of [
    ["Suspendre", "Suspendu"],
    ["Réactiver", "Actif"],
  ]) {
    await page
      .getByRole("button", { name: "Actions pour " + remainingOwner.userId })
      .click();
    await page.getByRole("menuitem", { name: action, exact: true }).click();
    await page.getByRole("button", { name: "Confirmer", exact: true }).click();
    await expect(
      page.getByRole("row", { name: new RegExp(remainingOwner.userId) }),
    ).toContainText(status);
  }
  await page.getByRole("button", { name: "Actions pour " + me.userId }).click();
  await page.getByRole("menuitem", { name: "Révoquer", exact: true }).click();
  await page.getByRole("button", { name: "Confirmer", exact: true }).click();
  await expect(page).not.toHaveURL(new RegExp("/app/" + orgA));
  await page.goto("/app/" + orgA);
  await expect(page.getByText("Votre accès a été retiré.")).toBeVisible();
  await page.getByRole("link", { name: "Ma session", exact: true }).click();
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page.getByText("Session serveur révoquée.")).toBeVisible();
  expect(
    (
      await other.get("/api/me", {
        headers: { Authorization: "Bearer " + access.accessToken },
      })
    ).status(),
  ).toBe(401);
  expect(
    await page.evaluate(() =>
      Object.values(localStorage).some((v) =>
        /accessToken|refreshToken|Qualification-/.test(v),
      ),
    ),
  ).toBe(false);
  await other.post("/api/auth/web/logout", {
    headers: { [csrf.headerName]: csrf.token },
  });
  await other.dispose();
});
