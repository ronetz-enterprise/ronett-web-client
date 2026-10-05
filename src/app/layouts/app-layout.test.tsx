import { useEffect } from "react";
import { useAuth } from "@/features/authentication";
import OrganizationRoute from "@/app/router/guards/organization-route";
import { AuthProvider } from "@/features/authentication";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { expect, it } from "vitest";
import AppLayout from "./app-layout";
import { ThemeProvider } from "@/app/providers/theme-provider";
import NotFoundPage from "@/pages/public/not-found-page";
import { useActiveOrganization } from "@/features/organizations";

/** Sonde du contexte actif : la page « Organisation » est devenue une redirection. */
function OrganizationPage() {
  const active = useActiveOrganization();
  return <p>{`Identifiant : ${active.organizationId}`}</p>;
}
import { createQueryClient, tenantKeys } from "@/shared/api/query-client";
const first = "00000000-0000-4000-8000-000000000001";
const second = "00000000-0000-4000-8000-000000000002";
function Login({ children }: { children: React.ReactNode }) {
  const { login, status } = useAuth();
  useEffect(() => {
    void login({
      email: "multi@example.test",
      password: "Fixture-pass-123",
    });
  }, [login]);
  return status === "authenticated" ? children : null;
}
function setup(path = `/app/${first}`) {
  const client = createQueryClient();
  const router = createMemoryRouter(
    [
      {
        path: "/app/:organizationId",
        Component: OrganizationRoute,
        children: [
          {
            Component: AppLayout,
            children: [
              { index: true, element: <h1>Contenu Outlet</h1> },
              { path: "organization", Component: OrganizationPage },
            ],
          },
        ],
      },
      { path: "*", Component: NotFoundPage },
    ],
    { initialEntries: [path] },
  );
  const rendered = render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <AuthProvider>
          <Login>
            <RouterProvider router={router} />
          </Login>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
  return { ...rendered, router, client };
}
function sidebarFooter(container: HTMLElement) {
  return container.querySelector('[data-slot="sidebar-footer"]') as HTMLElement;
}
function organizationTrigger(container: HTMLElement) {
  const header = container.querySelector(
    '[data-slot="sidebar-header"]',
  ) as HTMLElement;
  return within(header).getByRole("button", {
    name: /changer d'organisation$/,
  });
}
function accountTrigger(footer: HTMLElement) {
  return within(footer).getByRole("button", { name: /compte utilisateur$/ });
}
it("renders the existing sidebar, its Outlet, active route and collapse states", async () => {
  const user = userEvent.setup();
  const { container } = setup();
  expect(
    await screen.findByRole("heading", { name: "Contenu Outlet" }),
  ).toBeVisible();
  expect(
    screen.getByRole("navigation", { name: "Espace organisation" }),
  ).toBeVisible();
  expect(
    within(
      screen.getByRole("navigation", { name: "Espace organisation" }),
    ).getByRole("link", { name: "Tableau de bord" }),
  ).toHaveAttribute("aria-current", "page");
  // Le declencheur de la barre laterale est dans son en-tete : le second, dans
  // la barre mobile, n'existe pas en amont du CSS (non rendu en jsdom).
  const sidebar = container.querySelector(
    '[data-slot="sidebar"]',
  ) as HTMLElement;
  const collapse = within(sidebar).getByRole("button", {
    name: "Basculer la navigation",
  });
  await user.click(collapse);
  expect(container.querySelector('[data-slot="sidebar"]')).toHaveAttribute(
    "data-state",
    "collapsed",
  );
  await user.click(collapse);
  expect(container.querySelector('[data-slot="sidebar"]')).toHaveAttribute(
    "data-state",
    "expanded",
  );
});
it("opens and closes the mobile panel", async () => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 375,
  });
  const user = userEvent.setup();
  setup();
  await screen.findByRole("heading", { name: "Contenu Outlet" });
  await user.click(
    screen.getByRole("button", { name: "Basculer la navigation" }),
  );
  expect(
    await screen.findByRole("dialog", { name: "Navigation" }),
  ).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Fermer" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 1024,
  });
});
it("changes context and discards old tenant data", async () => {
  const { client, router } = setup(`/app/${first}/organization`);
  await screen.findByText("Identifiant : " + first);
  client.setQueryData(tenantKeys.resource(first, "sites"), ["first-tenant"]);
  await act(() => router.navigate(`/app/${second}/organization`));
  expect(await screen.findByText(`Identifiant : ${second}`)).toBeVisible();
  expect(
    client.getQueryData(tenantKeys.resource(first, "sites")),
  ).toBeUndefined();
  expect(screen.queryByText(`Identifiant : ${first}`)).not.toBeInTheDocument();
});
it("renders route 404", async () => {
  setup("/unknown");
  expect(
    await screen.findByRole("heading", { name: "Page introuvable" }),
  ).toBeVisible();
});

it("exposes the account menu in the sidebar footer", async () => {
  const { container } = setup();
  await screen.findByRole("heading", { name: "Contenu Outlet" });
  const footer = sidebarFooter(container);
  await userEvent.setup().click(accountTrigger(footer));
  const menu = await screen.findByRole("menu");
  expect(within(menu).getByText("Profil")).toBeVisible();
  expect(within(menu).getByText("Se déconnecter")).toBeVisible();
});

it("switches the theme from the account menu and remembers it", async () => {
  const user = userEvent.setup();
  const { container } = setup();
  await screen.findByRole("heading", { name: "Contenu Outlet" });
  await user.click(accountTrigger(sidebarFooter(container)));
  const menu = await screen.findByRole("menu");
  expect(
    within(menu).getByRole("menuitemradio", { name: "Système" }),
  ).toBeChecked();
  await user.click(within(menu).getByRole("menuitemradio", { name: "Sombre" }));
  await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
  expect(localStorage.getItem("ronetz.theme")).toBe("dark");
  await user.click(
    within(await screen.findByRole("menu")).getByRole("menuitemradio", {
      name: "Clair",
    }),
  );
  await waitFor(() => expect(document.documentElement).not.toHaveClass("dark"));
  localStorage.removeItem("ronetz.theme");
});

it("exposes the organization switcher in the sidebar header", async () => {
  const { container } = setup();
  await screen.findByRole("heading", { name: "Contenu Outlet" });
  await userEvent.setup().click(organizationTrigger(container));
  const menu = await screen.findByRole("menu");
  expect(
    within(menu).getByRole("menuitemradio", { name: "Organisation A" }),
  ).toBeChecked();
});

it("no longer renders a top navbar with an organization select", async () => {
  setup();
  await screen.findByRole("heading", { name: "Contenu Outlet" });
  expect(
    screen.queryByRole("combobox", { name: "Organisation active" }),
  ).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Profil utilisateur" }),
  ).toBeNull();
});

it("switches organization from the sidebar header and drops old tenant data", async () => {
  const user = userEvent.setup();
  const { client, container } = setup();
  await screen.findByRole("heading", { name: "Contenu Outlet" });
  client.setQueryData(tenantKeys.resource(first, "sites"), ["first-tenant"]);
  await user.click(organizationTrigger(container));
  await user.click(
    await screen.findByRole("menuitemradio", { name: "Organisation B" }),
  );
  await waitFor(() =>
    expect(
      client.getQueryData(tenantKeys.resource(first, "sites")),
    ).toBeUndefined(),
  );
  await waitFor(() =>
    expect(organizationTrigger(container)).toHaveAccessibleName(
      /Organisation B/,
    ),
  );
});

it("rejects malformed tenant identifiers", async () => {
  setup("/app/not-an-id");
  expect(
    await screen.findByRole("heading", { name: "Page introuvable" }),
  ).toBeVisible();
});
