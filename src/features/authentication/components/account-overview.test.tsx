import { useEffect } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { expect, it } from "vitest";
import { createQueryClient } from "@/shared/api/query-client";
import { AuthProvider, useAuth } from "../hooks/auth-provider";
import { AccountOverview } from "./account-overview";

function SignedIn({ children }: { children: React.ReactNode }) {
  const { login, status } = useAuth();
  useEffect(() => {
    void login({ email: "test@example.test", password: "Fixture-pass-123" });
  }, [login]);
  return status === "authenticated" ? children : null;
}

it("affiche l'identité, la session courante et la limite des autres appareils", async () => {
  render(
    <QueryClientProvider client={createQueryClient()}>
      <AuthProvider>
        <SignedIn>
          <MemoryRouter>
            <AccountOverview />
          </MemoryRouter>
        </SignedIn>
      </AuthProvider>
    </QueryClientProvider>,
  );
  expect(await screen.findByText("Cet appareil")).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Copier l’identifiant utilisateur" }),
  ).toBeVisible();
  expect(screen.getByRole("button", { name: "Se déconnecter" })).toBeVisible();
  expect(screen.getByText("Autres appareils")).toBeVisible();
});
