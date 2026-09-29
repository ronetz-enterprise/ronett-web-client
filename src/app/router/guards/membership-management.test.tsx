import { useEffect } from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { AuthProvider, useAuth } from "@/features/authentication";
import { createQueryClient } from "@/shared/api/query-client";
import { server } from "@/shared/testing/server";
import { config } from "@/shared/config/environment";
import { membership, orgA } from "@/shared/testing/tenant-fixtures";
import { fixtureOtherUser } from "@/shared/testing/member-handlers";
import OrganizationRoute from "./organization-route";
import OrganizationMembersPage from "@/pages/organization-settings/organization-members-page";
import OrganizationSettingsPage from "@/pages/organization-settings/organization-settings-page";
function SignedIn({ children }: { children: React.ReactNode }) {
  const { login, status } = useAuth();
  useEffect(() => {
    void login({ email: "test@example.test", password: "Fixture-pass-123" });
  }, [login]);
  return status === "authenticated" ? children : null;
}
function view(settings = false) {
  const client = createQueryClient();
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <SignedIn>
          <MemoryRouter initialEntries={["/app/" + orgA]}>
            <Routes>
              <Route
                path="/app/:organizationId"
                element={<OrganizationRoute />}
              >
                <Route
                  index
                  element={
                    settings ? (
                      <OrganizationSettingsPage />
                    ) : (
                      <OrganizationMembersPage />
                    )
                  }
                />
              </Route>
            </Routes>
          </MemoryRouter>
        </SignedIn>
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { client, user: userEvent.setup() };
}
const base = config.apiBaseUrl + "/api/organizations/" + orgA + "/memberships";
const denied = () =>
  HttpResponse.json(
    { title: "Denied", status: 403, code: "MEMBERSHIP_REVOKED" },
    { status: 403 },
  );
it("keeps a resource 403 visible after one access revalidation instead of retrying on each remount", async () => {
  const list = vi.fn(denied);
  const access = vi.fn(() => HttpResponse.json(membership()));
  server.use(
    http.get(base, list),
    http.get(config.apiBaseUrl + "/api/me/memberships/" + orgA, access),
  );
  const { client } = view();
  await screen.findByText("Vous n’avez pas accès à cette ressource.");
  await waitFor(() => expect(client.isFetching()).toBe(0));
  expect(list).toHaveBeenCalledTimes(1);
  expect(access).toHaveBeenCalledTimes(2);
});
it("removes tenant content when a mutation reports revoked permission", async () => {
  let revoked = false;
  server.use(
    http.get(config.apiBaseUrl + "/api/me/memberships/" + orgA, () =>
      revoked ? denied() : HttpResponse.json(membership()),
    ),
    http.patch(base + "/:userId/suspension", () => {
      revoked = true;
      return denied();
    }),
  );
  const { user } = view();
  await user.click(
    await screen.findByRole("button", {
      name: "Actions pour " + fixtureOtherUser,
    }),
  );
  await user.click(await screen.findByRole("menuitem", { name: "Suspendre" }));
  await user.click(await screen.findByRole("button", { name: "Confirmer" }));
  expect(await screen.findByText("Votre accès a été retiré.")).toBeVisible();
  expect(screen.queryByText(fixtureOtherUser)).not.toBeInTheDocument();
});
it("sends only one sensitive mutation for two immediate confirmations", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const patch = vi.fn(async () => {
    await gate;
    return new HttpResponse(null, { status: 204 });
  });
  server.use(http.patch(base + "/:userId/suspension", patch));
  const { user } = view();
  await user.click(
    await screen.findByRole("button", {
      name: "Actions pour " + fixtureOtherUser,
    }),
  );
  await user.click(await screen.findByRole("menuitem", { name: "Suspendre" }));
  const confirm = await screen.findByRole("button", { name: "Confirmer" });
  try {
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "En cours…" })).toBeDisabled();
  } finally {
    release();
  }
  await waitFor(() =>
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
  );
  expect(patch).toHaveBeenCalledTimes(1);
});
it("reads organization settings through the validated tenant without offering an unsupported edit", async () => {
  view(true);
  expect(await screen.findByText("XAF", { exact: true })).toBeVisible();
  expect(screen.getByText("Consultation uniquement")).toBeVisible();
  expect(
    screen.queryByRole("button", { name: /Enregistrer/ }),
  ).not.toBeInTheDocument();
});
