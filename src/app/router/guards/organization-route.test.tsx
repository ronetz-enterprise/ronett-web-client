import { useEffect } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { AuthProvider, useAuth } from "@/features/authentication";
import { server } from "@/shared/testing/server";
import { config } from "@/shared/config/environment";
import {
  createQueryClient,
  tenantKeys,
  clearOrganizationCache,
} from "@/shared/api/query-client";
import { organizationRoutes } from "@/shared/auth/organization-routes";
import AuthenticatedRoute from "./authenticated-route";
import OrganizationRoute from "./organization-route";
function Login({ children }: { children: React.ReactNode }) {
  const { login, status } = useAuth();
  useEffect(() => {
    void login({ email: "test@example.test", password: "Fixture-pass-123" });
  }, [login]);
  return status === "authenticated" ? children : null;
}
function view(id: string, authenticated = true) {
  const routes = (
    <MemoryRouter initialEntries={["/app/" + id]}>
      <Routes>
        <Route element={<AuthenticatedRoute />}>
          <Route path="/app/:organizationId" element={<OrganizationRoute />}>
            <Route index element={<h1>PRIVATE TENANT DATA</h1>} />
          </Route>
        </Route>
        <Route path="/auth/login" element={<h1>Connexion</h1>} />
      </Routes>
    </MemoryRouter>
  );
  const client = createQueryClient();
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        {authenticated ? <Login>{routes}</Login> : routes}
      </AuthProvider>
    </QueryClientProvider>,
  );
  return client;
}
it("requires login before attempting tenant resolution", async () => {
  view("00000000-0000-4000-8000-000000000010", false);
  expect(
    await screen.findByRole("heading", { name: "Connexion" }),
  ).toBeVisible();
});
it("rejects malformed identifiers", async () => {
  view("not-an-id");
  expect(
    await screen.findByRole("heading", { name: "Page introuvable" }),
  ).toBeVisible();
});
it.each([
  "00000000-0000-4000-8000-000000000010",
  "00000000-0000-4000-8000-000000000020",
])(
  "fails closed for %s without probing foreign organization or membership data",
  async (id) => {
    const get = vi.fn(() =>
      HttpResponse.json({ name: "FOREIGN ORGANIZATION SECRET" }),
    );
    server.use(http.get(config.apiBaseUrl + "/api/organizations/*", get));
    localStorage.setItem("lastOrganizationId", id);
    view(id);
    expect(
      await screen.findByRole("heading", { name: "Accès non autorisé" }),
    ).toBeVisible();
    expect(screen.queryByText("PRIVATE TENANT DATA")).not.toBeInTheDocument();
    expect(
      screen.queryByText("FOREIGN ORGANIZATION SECRET"),
    ).not.toBeInTheDocument();
    expect(get).not.toHaveBeenCalled();
    localStorage.removeItem("lastOrganizationId");
  },
);
it("separates tenants including equal future RADIUS usernames and keeps global cache", async () => {
  const client = createQueryClient();
  const a = "00000000-0000-4000-8000-000000000010";
  const b = "00000000-0000-4000-8000-000000000020";
  const keyA = tenantKeys.resource(a, "credentials", "same-username");
  const keyB = tenantKeys.resource(b, "credentials", "same-username");
  expect(keyA).not.toEqual(keyB);
  client.setQueryData(["global"], "preserved");
  client.setQueryData(keyA, "A");
  client.setQueryData(keyB, "B");
  let finish!: (value: string) => void;
  const pending = client
    .fetchQuery({
      queryKey: tenantKeys.resource(a, "pending"),
      queryFn: () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        }),
    })
    .catch(() => undefined);
  clearOrganizationCache(client, a);
  finish("late A");
  await pending;
  await waitFor(() =>
    expect(client.getQueriesData({ queryKey: tenantKeys.all(a) })).toEqual([]),
  );
  expect(client.getQueryData(keyB)).toBe("B");
  expect(client.getQueryData(["global"])).toBe("preserved");
});
it("centralizes validated organization URLs and rejects external or malformed IDs", () => {
  const id = "00000000-0000-4000-8000-000000000010";
  expect(organizationRoutes.dashboard(id)).toBe("/app/" + id);
  expect(organizationRoutes.overview(id)).toBe("/app/" + id + "/organization");
  expect(() => organizationRoutes.dashboard("//evil.test")).toThrow();
});

it("renders authorized Org-A only after the server access check", async () => {
  view("00000000-0000-4000-8000-000000000001");
  expect(await screen.findByText("PRIVATE TENANT DATA")).toBeVisible();
});
it.each([
  ["MEMBERSHIP_SUSPENDED", "Votre accès est suspendu."],
  ["MEMBERSHIP_REVOKED", "Votre accès a été retiré."],
  ["ORGANIZATION_SUSPENDED", "Cette organisation est suspendue."],
  ["ORGANIZATION_CLOSED", "Cette organisation est fermée."],
])("blocks %s without rendering tenant data", async (code, message) => {
  server.use(
    http.get(config.apiBaseUrl + "/api/me/memberships/:id", () =>
      HttpResponse.json(
        { title: "Denied", status: 403, code },
        { status: 403 },
      ),
    ),
  );
  view("00000000-0000-4000-8000-000000000001");
  expect(await screen.findByText(message)).toBeVisible();
  expect(screen.queryByText("PRIVATE TENANT DATA")).not.toBeInTheDocument();
});
it("keeps membership loading errors distinct from an empty list", async () => {
  server.use(
    http.get(config.apiBaseUrl + "/api/me/memberships", () =>
      HttpResponse.json({ title: "Unavailable", status: 503 }, { status: 503 }),
    ),
  );
  view("00000000-0000-4000-8000-000000000001");
  expect(
    await screen.findByRole("heading", { name: "Accès non vérifié" }),
  ).toBeVisible();
  expect(screen.queryByText("PRIVATE TENANT DATA")).not.toBeInTheDocument();
});
it("removes an authorized outlet and its sensitive cache after revocation revalidation", async () => {
  const id = "00000000-0000-4000-8000-000000000001";
  const client = view(id);
  await screen.findByText("PRIVATE TENANT DATA");
  client.setQueryData(tenantKeys.resource(id, "sensitive"), "secret A");
  server.use(
    http.get(config.apiBaseUrl + "/api/me/memberships/:id", () =>
      HttpResponse.json(
        { title: "Denied", status: 403, code: "MEMBERSHIP_REVOKED" },
        { status: 403 },
      ),
    ),
  );
  await client.invalidateQueries({
    queryKey: tenantKeys.resource(id, "access"),
  });
  expect(await screen.findByText("Votre accès a été retiré.")).toBeVisible();
  expect(screen.queryByText("PRIVATE TENANT DATA")).not.toBeInTheDocument();
  await waitFor(() =>
    expect(
      client.getQueryData(tenantKeys.resource(id, "sensitive")),
    ).toBeUndefined(),
  );
});
