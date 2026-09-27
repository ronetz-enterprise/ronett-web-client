import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { expect, it } from "vitest";
import AppLayout from "./app-layout";
import NotFoundPage from "@/pages/public/not-found-page";
import OrganizationPage from "@/pages/organization/organization-page";
import { createQueryClient, tenantKeys } from "@/shared/api/query-client";
const first = "00000000-0000-4000-8000-000000000001";
const second = "00000000-0000-4000-8000-000000000002";
function setup(path = `/app/${first}`) {
  const client = createQueryClient();
  const router = createMemoryRouter(
    [
      {
        path: "/app/:organizationId",
        Component: AppLayout,
        children: [
          { index: true, element: <h1>Contenu Outlet</h1> },
          { path: "organization", Component: OrganizationPage },
        ],
      },
      { path: "*", Component: NotFoundPage },
    ],
    { initialEntries: [path] },
  );
  const rendered = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...rendered, router, client };
}
it("renders the existing sidebar, its Outlet, active route and collapse states", async () => {
  const user = userEvent.setup();
  const { container } = setup();
  expect(screen.getByRole("heading", { name: "Contenu Outlet" })).toBeVisible();
  expect(
    screen.getByRole("navigation", { name: "Espace organisation" }),
  ).toBeVisible();
  expect(
    within(
      screen.getByRole("navigation", { name: "Espace organisation" }),
    ).getByRole("link", { name: "Tableau de bord" }),
  ).toHaveAttribute("aria-current", "page");
  await user.click(
    screen.getByRole("button", {
      name: "Basculer la navigation",
      hidden: false,
    }),
  );
  expect(container.querySelector('[data-slot="sidebar"]')).toHaveAttribute(
    "data-state",
    "collapsed",
  );
  await user.click(
    screen.getByRole("button", {
      name: "Basculer la navigation",
      hidden: false,
    }),
  );
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
  client.setQueryData(tenantKeys.resource(first, "sites"), ["first-tenant"]);
  await act(() => router.navigate(`/app/${second}/organization`));
  expect(screen.getByText(`Identifiant : ${second}`)).toBeVisible();
  expect(
    client.getQueryData(tenantKeys.resource(first, "sites")),
  ).toBeUndefined();
  expect(screen.queryByText(`Identifiant : ${first}`)).not.toBeInTheDocument();
});
it("renders route 404", () => {
  setup("/unknown");
  expect(
    screen.getByRole("heading", { name: "Page introuvable" }),
  ).toBeVisible();
});
it("rejects malformed tenant identifiers", () => {
  setup("/app/not-an-id");
  expect(
    screen.getByRole("heading", { name: "Page introuvable" }),
  ).toBeVisible();
});
