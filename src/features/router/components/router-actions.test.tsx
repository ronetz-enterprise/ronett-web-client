import { useEffect } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { AuthProvider, useAuth } from "@/features/authentication";
import { membershipSchema } from "@/features/memberships";
import { createQueryClient } from "@/shared/api/query-client";
import { notificationManager } from "@/shared/components/notifications";
import { server } from "@/shared/testing/server";
import { membership, orgA } from "@/shared/testing/tenant-fixtures";
import {
  fixtureRouters,
  fixtureScript,
  operationsHandlers,
} from "@/shared/testing/operations-handlers";
import { routerRoutes } from "../model/router";
import { RouterDetails } from "./router-details";

const active = membershipSchema.parse(membership(orgA));
const [registered, expired] = fixtureRouters;

function SignedIn({ children }: { children: React.ReactNode }) {
  const { login, status } = useAuth();
  useEffect(() => {
    void login({ email: "test@example.test", password: "Fixture-pass-123" });
  }, [login]);
  return status === "authenticated" ? children : null;
}
function view(
  routerId: string,
  tab: "state" | "settings" = "settings",
  client: QueryClient = createQueryClient(),
) {
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <SignedIn>
          <MemoryRouter
            initialEntries={[
              (tab === "settings"
                ? routerRoutes.settings
                : routerRoutes.detail)(active.organizationId, routerId),
            ]}
          >
            <RouterDetails active={active} routerId={routerId} tab={tab} />
          </MemoryRouter>
        </SignedIn>
      </AuthProvider>
    </QueryClientProvider>,
  );
  return client;
}
/** Captures the browser download without navigating jsdom to a blob: URL. */
function captureDownload() {
  const saved: { blob?: Blob; name?: string } = {};
  Object.assign(URL, {
    createObjectURL: vi.fn((blob: Blob) => {
      saved.blob = blob;
      return "blob:ronetz-test";
    }),
    revokeObjectURL: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    saved.name = this.download;
  });
  return saved;
}
const withRouter = (overrides: Record<string, unknown>) => {
  const router = { ...registered, ...overrides };
  return [
    http.get(`*/api/routers/${router.id}`, () => HttpResponse.json(router)),
    http.get(`*/api/routers/${router.id}/provisioning`, () =>
      HttpResponse.json(router),
    ),
  ];
};

afterEach(() => {
  vi.useRealTimers();
});

describe("Télécharger le script", () => {
  it("télécharge le script courant sans le mettre en cache ni le journaliser", async () => {
    server.use(...operationsHandlers);
    const accepts: (string | null)[] = [];
    server.events.on("request:start", ({ request }) => {
      if (request.url.includes("/configuration-artifacts/"))
        accepts.push(request.headers.get("Accept"));
    });
    const logs = (["log", "info", "warn", "error", "debug"] as const).map(
      (level) => vi.spyOn(console, level),
    );
    const saved = captureDownload();
    const notify = vi.spyOn(notificationManager, "add");
    const client = view(registered.id);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Télécharger le script" }),
    );
    await waitFor(() => expect(saved.name).toBe(`ronetz-${registered.id}.rsc`));
    expect(await saved.blob!.text()).toBe(fixtureScript(registered.id));
    expect(accepts).toEqual(["text/plain, application/problem+json"]);
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Script téléchargé" }),
    );
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:ronetz-test");
    const cached = JSON.stringify(
      client
        .getQueryCache()
        .getAll()
        .map((query) => query.state.data),
    );
    expect(cached).not.toContain("/system identity");
    expect(client.getMutationCache().getAll()).toHaveLength(0);
    for (const spy of logs)
      for (const call of spy.mock.calls)
        expect(JSON.stringify(call)).not.toContain("/system identity");
    server.events.removeAllListeners();
  });

  it("propose de renouveler les instructions quand le script a expiré (410)", async () => {
    server.use(...operationsHandlers);
    const saved = captureDownload();
    view(expired.id);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Télécharger le script" }),
    );
    expect(await screen.findByText("Script expiré")).toBeTruthy();
    expect(saved.blob).toBeUndefined();
    await user.click(
      screen.getByRole("button", { name: "Générer un nouveau script" }),
    );
    expect(
      await screen.findByRole("alertdialog", {
        name: "Générer un nouveau script ?",
      }),
    ).toBeTruthy();
  });

  it("n'affiche pas le bouton sans artefact courant", async () => {
    // Handlers passed first take precedence over the fixture defaults.
    server.use(
      ...withRouter({ configurationArtifactId: null }),
      ...operationsHandlers,
    );
    view(registered.id);
    expect(
      await screen.findByRole("button", { name: "Suspendre le routeur" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Télécharger le script" }),
    ).toBeNull();
  });
});

describe("Détails", () => {
  it("modifie le nom sur place dans l’onglet Paramètres", async () => {
    let name = registered.name;
    server.use(
      http.get(`*/api/routers/${registered.id}`, () =>
        HttpResponse.json({ ...registered, name }),
      ),
      http.get(`*/api/routers/${registered.id}/provisioning`, () =>
        HttpResponse.json({ ...registered, name }),
      ),
      http.patch(`*/api/routers/${registered.id}/name`, async ({ request }) => {
        name = ((await request.json()) as { name: string }).name;
        return HttpResponse.json({ ...registered, name });
      }),
      ...operationsHandlers,
    );
    view(registered.id);
    const user = userEvent.setup();
    const field = await screen.findByLabelText("Nom du routeur");
    const save = screen.getByRole("button", { name: "Enregistrer" });
    expect(save).toHaveProperty("disabled", true);
    expect(
      screen
        .getByRole("tab", { name: "Paramètres" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    await user.clear(field);
    await user.type(field, "Salle du fond");
    await user.click(save);
    await waitFor(() => expect(name).toBe("Salle du fond"));
  });
});

describe("pendingAction", () => {
  it("désactive les commandes et poursuit le suivi jusqu'à la confirmation", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const suspended = {
      ...registered,
      lifecycleStatus: "SUSPENDED",
      pendingAction: "SUSPEND",
    };
    let confirmed = false;
    const current = () =>
      confirmed ? { ...suspended, pendingAction: null } : suspended;
    let polls = 0;
    server.use(
      http.get(`*/api/routers/${registered.id}`, () =>
        HttpResponse.json(current()),
      ),
      http.get(`*/api/routers/${registered.id}/provisioning`, () => {
        polls++;
        return HttpResponse.json(current());
      }),
      ...operationsHandlers,
    );
    view(registered.id);
    expect(
      await screen.findByText("Demande en cours de traitement"),
    ).toBeTruthy();
    expect(screen.getByText(/Demande de suspension en cours/)).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Réactiver le routeur" }),
    ).toBeNull();
    await waitFor(() => expect(polls).toBe(1));
    // Toujours en attente : le suivi continue malgré un état SUSPENDED stable.
    await act(() => vi.advanceTimersByTimeAsync(5_000));
    await waitFor(() => expect(polls).toBe(2));
    confirmed = true;
    await act(() => vi.advanceTimersByTimeAsync(5_000));
    await waitFor(() => expect(polls).toBe(3));
    expect(
      await screen.findByRole("button", { name: "Réactiver le routeur" }),
    ).toBeTruthy();
    expect(screen.queryByText("Demande en cours de traitement")).toBeNull();
    // Confirmé : plus de consultation automatique.
    await act(() => vi.advanceTimersByTimeAsync(15_000));
    expect(polls).toBe(3);
  });
});

describe("Guide de mise en service", () => {
  it("génère le script en un clic puis guide l'installation", async () => {
    let current: Record<string, unknown> = {
      ...registered,
      provisioningStatus: "NOT_REQUESTED",
      connectivityStatus: "UNKNOWN",
      configurationArtifactId: null,
      lastSeenAt: null,
    };
    const keys: (string | null)[] = [];
    server.use(
      http.get(`*/api/routers/${registered.id}`, () =>
        HttpResponse.json(current),
      ),
      http.get(`*/api/routers/${registered.id}/provisioning`, () =>
        HttpResponse.json(current),
      ),
      http.post(
        `*/api/routers/${registered.id}/provisioning`,
        ({ request }) => {
          keys.push(request.headers.get("Idempotency-Key"));
          current = {
            ...current,
            provisioningStatus: "PENDING_ENROLLMENT",
            configurationArtifactId: registered.configurationArtifactId,
          };
          return HttpResponse.json(current, { status: 202 });
        },
      ),
      ...operationsHandlers,
    );
    view(registered.id, "state");
    const user = userEvent.setup();
    expect(
      await screen.findByRole("heading", {
        name: "Préparez le script d’installation",
      }),
    ).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Générer le script d’installation" }),
    );
    // Action principale du guide : pas de confirmation intermédiaire.
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(
      await screen.findByRole("heading", {
        name: "Installez le script sur votre routeur",
      }),
    ).toBeTruthy();
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/);
    // Un seul bouton de téléchargement, porté par le guide.
    expect(
      screen.getAllByRole("button", { name: "Télécharger le script" }),
    ).toHaveLength(1);
  });
});
