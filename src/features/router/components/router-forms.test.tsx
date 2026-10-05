import { useEffect } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { AuthProvider, useAuth } from "@/features/authentication";
import { membershipSchema } from "@/features/memberships";
import { createQueryClient } from "@/shared/api/query-client";
import { server } from "@/shared/testing/server";
import { membership, orgA } from "@/shared/testing/tenant-fixtures";
import {
  fixtureSites,
  operationsHandlers,
} from "@/shared/testing/operations-handlers";
import { RouterCreate } from "./router-forms";

const active = membershipSchema.parse(membership(orgA));
const [activeSite, suspendedSite] = fixtureSites;

function SignedIn({ children }: { children: React.ReactNode }) {
  const { login, status } = useAuth();
  useEffect(() => {
    void login({ email: "test@example.test", password: "Fixture-pass-123" });
  }, [login]);
  return status === "authenticated" ? children : null;
}
function view(siteId?: string) {
  render(
    <QueryClientProvider client={createQueryClient()}>
      <AuthProvider>
        <SignedIn>
          <MemoryRouter>
            <RouterCreate active={active} siteId={siteId} />
          </MemoryRouter>
        </SignedIn>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("RouterCreate", () => {
  it("signale un site inactif reçu en lien sans bloquer le choix d'un autre", async () => {
    server.use(...operationsHandlers);
    view(suspendedSite.id);
    expect(
      await screen.findByText(new RegExp(`${suspendedSite.name}.*pas actif`)),
    ).toBeTruthy();
    const site = screen.getByRole("combobox", { name: "Site" });
    expect(site.hasAttribute("disabled")).toBe(false);
    expect(site.textContent).not.toContain(suspendedSite.name);
    expect(
      screen.getByRole("button", { name: "Ajouter le routeur" }),
    ).toBeTruthy();
  });

  it("préremplit un site actif sans le verrouiller", async () => {
    server.use(...operationsHandlers);
    view(activeSite.id);
    const site = await screen.findByRole("combobox", { name: "Site" });
    expect(site.textContent).toContain(activeSite.name);
    expect(site.hasAttribute("disabled")).toBe(false);
    expect(
      screen.getByRole("list", { name: "Étapes de mise en service" }),
    ).toBeTruthy();
  });
});
