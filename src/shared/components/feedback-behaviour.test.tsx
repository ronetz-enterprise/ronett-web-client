import { afterEach, expect, it, vi } from "vitest";
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from "@tanstack/react-query";
import { Link, RouterProvider, createMemoryRouter } from "react-router";
import { useForm } from "react-hook-form";
import { useNotifiedMutation } from "@/shared/api/use-notified-mutation";
import { useOnline } from "@/shared/hooks/use-online";
import { FormField, ValidatedForm } from "./form";
import { PageLoading } from "./feedback";
import { NotificationProvider, notify } from "./notifications";
import { UnsavedChangesGuard } from "./unsaved-changes";

afterEach(() => onlineManager.setOnline(true));

it("shows typed toasts and keeps errors until dismissed", async () => {
  render(<NotificationProvider>contenu</NotificationProvider>);
  act(() => {
    notify.success("Site créé", "Douala Centre");
    notify.error("Échec du versement");
  });
  expect(await screen.findByText("Site créé")).toBeVisible();
  expect(screen.getByText("Douala Centre")).toBeVisible();
  // Base UI masque la fermeture aux lecteurs d'écran tant que la zone des toasts n'a pas le focus.
  // Une erreur est prioritaire : Base UI la recopie aussi dans une zone d'annonce pour lecteurs d'écran.
  expect(
    screen.getAllByText("Échec du versement").length,
  ).toBeGreaterThanOrEqual(1);
  expect(
    document.querySelectorAll('button[aria-label="Fermer la notification"]'),
  ).toHaveLength(2);
});

it("useNotifiedMutation notifies success and refreshes the given queries", async () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>
      <NotificationProvider>{children}</NotificationProvider>
    </QueryClientProvider>
  );
  const { result } = renderHook(
    () =>
      useNotifiedMutation<{ name: string }, string>({
        mutationFn: async (name) => ({ name }),
        success: (data) => ({ title: "Routeur créé", description: data.name }),
        invalidate: [["routers"]],
      }),
    { wrapper },
  );
  await act(() => result.current.mutateAsync("Hall"));
  expect(await screen.findByText("Routeur créé")).toBeVisible();
  expect(screen.getByText("Hall")).toBeVisible();
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["routers"] });
});

it("blocks in-app navigation away from unsaved changes until confirmed", async () => {
  const user = userEvent.setup();
  const router = createMemoryRouter(
    [
      {
        path: "/form",
        element: (
          <>
            <UnsavedChangesGuard when />
            <Link to="/ailleurs">Partir</Link>
          </>
        ),
      },
      { path: "/ailleurs", element: <p>Arrivé</p> },
    ],
    { initialEntries: ["/form"] },
  );
  render(<RouterProvider router={router} />);
  await user.click(screen.getByRole("link", { name: "Partir" }));
  expect(
    await screen.findByRole("alertdialog", {
      name: "Quitter sans enregistrer ?",
    }),
  ).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Continuer la saisie" }));
  expect(router.state.location.pathname).toBe("/form");
  await user.click(screen.getByRole("link", { name: "Partir" }));
  await user.click(await screen.findByRole("button", { name: "Quitter" }));
  expect(await screen.findByText("Arrivé")).toBeVisible();
});

it("does not block when nothing is pending", async () => {
  const user = userEvent.setup();
  const router = createMemoryRouter(
    [
      {
        path: "/form",
        element: (
          <>
            <UnsavedChangesGuard when={false} />
            <Link to="/ailleurs">Partir</Link>
          </>
        ),
      },
      { path: "/ailleurs", element: <p>Arrivé</p> },
    ],
    { initialEntries: ["/form"] },
  );
  render(<RouterProvider router={router} />);
  await user.click(screen.getByRole("link", { name: "Partir" }));
  expect(await screen.findByText("Arrivé")).toBeVisible();
});

it("suspends form submission while offline", async () => {
  function Demo() {
    const form = useForm({ defaultValues: { name: "" } });
    return (
      <ValidatedForm form={form} onSubmit={() => {}} submitLabel="Enregistrer">
        <FormField name="name" label="Nom" />
      </ValidatedForm>
    );
  }
  render(<Demo />);
  expect(screen.getByRole("button", { name: "Enregistrer" })).toBeEnabled();
  act(() => onlineManager.setOnline(false));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /Enregistrer/ })).toBeDisabled(),
  );
  expect(screen.getByText(/Hors ligne/)).toBeVisible();
});

it("useOnline follows the shared online manager", () => {
  const { result } = renderHook(() => useOnline());
  expect(result.current).toBe(true);
  act(() => onlineManager.setOnline(false));
  expect(result.current).toBe(false);
});

it("PageLoading takes the shape of the expected content", () => {
  const { container, rerender } = render(<PageLoading />);
  expect(container.querySelectorAll(".h-11")).toHaveLength(6);
  rerender(<PageLoading variant="form" />);
  expect(container.querySelector(".max-w-2xl")).not.toBeNull();
  expect(
    screen.getByRole("status", { name: "Chargement du contenu" }),
  ).toBeInTheDocument();
});
