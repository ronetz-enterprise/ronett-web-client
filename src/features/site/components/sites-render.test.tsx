import { useEffect } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { AuthProvider, useAuth } from "@/features/authentication";
import { createQueryClient } from "@/shared/api/query-client";
import { server } from "@/shared/testing/server";
import { membership, orgA } from "@/shared/testing/tenant-fixtures";
import { membershipSchema } from "@/features/memberships";
import { SiteCreate, SiteDetails } from "./site-screens";
import { SiteShell } from "./site-shell";
import { SitesList } from "./sites-list";

const active = membershipSchema.parse(membership(orgA));
const siteId = "3f6c1f5e-0f3a-4a1e-9c0f-2b7d1e4a9c02";
function site(overrides: Record<string, unknown> = {}) {
  return {
    id: siteId,
    organizationId: orgA,
    name: "Site de Douala",
    description: "Emplacement principal",
    city: "Douala",
    district: "Bonabéri",
    addressDetails: "Rue Joss",
    timezone: "Africa/Douala",
    status: "ACTIVE",
    createdAt: "2026-04-15T10:00:00+00:00",
    updatedAt: "2026-05-02T10:00:00+00:00",
    ...overrides,
  };
}

function SignedIn({ children }: { children: React.ReactNode }) {
  const { login, status } = useAuth();
  useEffect(() => {
    void login({ email: "test@example.test", password: "Fixture-pass-123" });
  }, [login]);
  return status === "authenticated" ? children : null;
}

function view(path: string) {
  render(
    <QueryClientProvider client={createQueryClient()}>
      <AuthProvider>
        <SignedIn>
          <SiteShell>
            <MemoryRouter initialEntries={[path]}>
              <Routes>
                <Route
                  path="/app/:org/sites"
                  element={<SitesList active={active} />}
                />
                <Route
                  path="/app/:org/sites/new"
                  element={<SiteCreate active={active} />}
                />
                <Route
                  path="/app/:org/sites/:siteId"
                  element={<SiteDetails active={active} siteId={siteId} />}
                />
                <Route
                  path="/app/:org/sites/:siteId/settings"
                  element={
                    <SiteDetails active={active} siteId={siteId} editing />
                  }
                />
              </Routes>
            </MemoryRouter>
          </SiteShell>
        </SignedIn>
      </AuthProvider>
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

it("liste les sites avec leurs actions de ligne", async () => {
  server.use(
    http.get("*/api/organizations/:org/sites", () =>
      HttpResponse.json([site()]),
    ),
  );
  view(`/app/${orgA}/sites`);
  expect(await screen.findByText("Site de Douala")).toBeTruthy();
  expect(screen.getByText(/1 résultat/)).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Modifier Site de Douala" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Actions pour Site de Douala" }),
  ).toBeTruthy();
});

it("filtre la liste par statut depuis le menu dedie", async () => {
  server.use(
    http.get("*/api/organizations/:org/sites", () =>
      HttpResponse.json([site()]),
    ),
  );
  view(`/app/${orgA}/sites`);
  expect(await screen.findByText("Site de Douala")).toBeTruthy();
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", { name: /Ajouter un filtre par statut/ }),
  );
  await user.click(await screen.findByRole("menuitemradio", { name: "Fermé" }));
  await waitFor(() => expect(screen.getByText("Aucun résultat")).toBeTruthy());
});

it("filtre la liste par recherche", async () => {
  server.use(
    http.get("*/api/organizations/:org/sites", () =>
      HttpResponse.json([site()]),
    ),
  );
  view(`/app/${orgA}/sites`);
  expect(await screen.findByText("Site de Douala")).toBeTruthy();
  const user = userEvent.setup();
  await user.type(
    screen.getByLabelText(/Rechercher un site par nom/),
    "inconnu",
  );
  await waitFor(() => expect(screen.getByText("Aucun résultat")).toBeTruthy());
});

it("n'expose pas l'edition en ligne pour un site ferme", async () => {
  server.use(
    http.get("*/api/organizations/:org/sites", () =>
      HttpResponse.json([site({ status: "CLOSED" })]),
    ),
  );
  view(`/app/${orgA}/sites`);
  await screen.findByText("Site de Douala");
  expect(
    screen.queryByRole("button", { name: /Modifier Site de Douala/ }),
  ).toBeNull();
});

it("invite a creer un site quand l'organisation n'en a aucun", async () => {
  server.use(
    http.get("*/api/organizations/:org/sites", () => HttpResponse.json([])),
  );
  view(`/app/${orgA}/sites`);
  expect(await screen.findByText("Aucun site")).toBeTruthy();
});

it("affiche le detail et bascule vers les parametres par onglet", async () => {
  server.use(
    http.get("*/api/organizations/:org/sites/:id", () =>
      HttpResponse.json(site()),
    ),
  );
  view(`/app/${orgA}/sites/${siteId}`);
  expect(await screen.findByText("Emplacement")).toBeTruthy();
  expect(screen.getByText("Bonabéri")).toBeTruthy();
  expect(
    screen
      .getByRole("tab", { name: "Informations" })
      .getAttribute("aria-selected"),
  ).toBe("true");
  const user = userEvent.setup();
  await user.click(screen.getByRole("tab", { name: "Paramètres" }));
  expect(await screen.findByText("Informations du site")).toBeTruthy();
  expect(
    screen
      .getByRole("tab", { name: "Paramètres" })
      .getAttribute("aria-selected"),
  ).toBe("true");
});

it("affiche le formulaire de creation avec ses actions", async () => {
  view(`/app/${orgA}/sites/new`);
  expect(await screen.findByLabelText("Nom du site")).toBeTruthy();
  expect(screen.getByRole("button", { name: /Créer le site/ })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Annuler" })).toBeTruthy();
});
