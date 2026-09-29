import { useEffect } from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { AuthProvider, useAuth } from "@/features/authentication";
import { createQueryClient } from "@/shared/api/query-client";
import { server } from "@/shared/testing/server";
import { config } from "@/shared/config/environment";
import { membership, orgA, orgB } from "@/shared/testing/tenant-fixtures";
import {
  fixtureOtherUser,
  fixtureCurrentUser,
  fixtureMembers,
} from "@/shared/testing/member-handlers";
import { membershipSchema } from "../queries/current-memberships";
import { OrganizationMembers } from "./organization-members";
const active = membershipSchema.parse(membership());
function SignedIn({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const { login, status } = useAuth();
  useEffect(() => {
    void login({ email, password: "Fixture-pass-123" });
  }, [email, login]);
  return status === "authenticated" ? children : null;
}
function view(email = "test@example.test", permissions = active.permissions) {
  render(
    <QueryClientProvider client={createQueryClient()}>
      <AuthProvider>
        <SignedIn email={email}>
          <MemoryRouter initialEntries={["/members"]}>
            <Routes>
              <Route
                path="/members"
                element={
                  <OrganizationMembers active={{ ...active, permissions }} />
                }
              />
              <Route
                path="/organizations/select"
                element={<h1>Choix après retrait</h1>}
              />
            </Routes>
          </MemoryRouter>
        </SignedIn>
      </AuthProvider>
    </QueryClientProvider>,
  );
  return userEvent.setup();
}
async function action(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  target = fixtureOtherUser,
) {
  const button = await screen.findByRole("button", {
    name: "Actions pour " + target,
  });
  await waitFor(() => expect(button).toBeEnabled());
  await user.click(button);
  await user.click(await screen.findByRole("menuitem", { name: label }));
  await user.click(await screen.findByRole("button", { name: "Confirmer" }));
}
it("lists actual UUIDs and performs suspend/reactivate/revoke with confirmations", async () => {
  const user = view();
  await screen.findByText(fixtureOtherUser);
  await action(user, "Suspendre");
  await waitFor(() =>
    expect(
      within(
        screen.getByRole("row", { name: new RegExp(fixtureOtherUser) }),
      ).getByText("Suspendu"),
    ).toBeVisible(),
  );
  await action(user, "Réactiver");
  await waitFor(() =>
    expect(
      within(
        screen.getByRole("row", { name: new RegExp(fixtureOtherUser) }),
      ).getByText("Actif"),
    ).toBeVisible(),
  );
  await action(user, "Révoquer");
  await waitFor(() =>
    expect(
      within(
        screen.getByRole("row", { name: new RegExp(fixtureOtherUser) }),
      ).getByText("Révoqué"),
    ).toBeVisible(),
  );
}, 15_000);
it("protects the last OWNER and keeps unsupported operations absent", async () => {
  const user = view("last-owner@example.test");
  await user.click(
    await screen.findByRole("button", {
      name: "Actions pour " + fixtureCurrentUser,
    }),
  );
  expect(
    await screen.findByRole("menuitem", { name: "Suspendre" }),
  ).toHaveAttribute("aria-disabled", "true");
  expect(
    await screen.findByRole("menuitem", { name: "Révoquer" }),
  ).toHaveAttribute("aria-disabled", "true");
  expect(
    screen.queryByRole("button", { name: /Inviter/ }),
  ).not.toBeInTheDocument();
});
it("can add only an existing UUID as OWNER with exact body", async () => {
  const user = view();
  await user.click(
    await screen.findByRole("button", { name: "Ajouter un utilisateur" }),
  );
  await user.type(
    screen.getByLabelText("Identifiant utilisateur"),
    "00000000-0000-4000-8000-000000000066",
  );
  await user.click(screen.getByRole("button", { name: "Ajouter comme OWNER" }));
  expect(
    await screen.findByText("00000000-0000-4000-8000-000000000066"),
  ).toBeVisible();
});
it("renders a genuine empty list separately from a loading failure", async () => {
  view("empty-members@example.test");
  expect(await screen.findByText("Aucun membre")).toBeVisible();
});
it("shows service failures and correlation safely", async () => {
  view("members-error@example.test");
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "temporairement indisponible",
  );
  expect(screen.queryByText("Aucun membre")).not.toBeInTheDocument();
});
it("does not render mutations without the explicit capability", async () => {
  view("test@example.test", ["ORGANIZATION_READ", "MEMBERSHIP_READ"]);
  await screen.findByText(fixtureOtherUser);
  expect(
    screen.queryByRole("button", { name: /Actions pour/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Ajouter un utilisateur" }),
  ).not.toBeInTheDocument();
});
it("rejects a DTO containing another organization's membership", async () => {
  const request = vi.fn(() =>
    HttpResponse.json(fixtureMembers("test@example.test", orgB)),
  );
  server.use(
    http.get(
      config.apiBaseUrl + "/api/organizations/" + orgA + "/memberships",
      request,
    ),
  );
  view();
  expect(await screen.findByRole("alert")).toBeVisible();
  expect(screen.queryByText(fixtureOtherUser)).not.toBeInTheDocument();
});
it("redirects immediately after withdrawing the current membership", async () => {
  const user = view();
  await action(user, "Révoquer", fixtureCurrentUser);
  expect(
    await screen.findByRole("heading", { name: "Choix après retrait" }),
  ).toBeVisible();
});
it("keeps a rejected mutation visible without exposing backend detail", async () => {
  server.use(
    http.patch(
      config.apiBaseUrl +
        "/api/organizations/:id/memberships/:userId/suspension",
      () =>
        HttpResponse.json(
          {
            title: "Refused",
            status: 409,
            code: "MEMBERSHIP_TRANSITION_FORBIDDEN",
            detail: "sensitive internal text",
          },
          { status: 409 },
        ),
    ),
  );
  const user = view();
  await action(user, "Suspendre");
  expect(await screen.findByRole("alert")).toHaveTextContent("conflit");
  expect(screen.queryByText("sensitive internal text")).not.toBeInTheDocument();
});
