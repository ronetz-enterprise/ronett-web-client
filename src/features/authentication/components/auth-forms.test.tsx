import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/shared/testing/server";
import { config } from "@/shared/config/environment";
import { AuthProvider } from "../hooks/auth-provider";
import { LoginForm, RegisterForm } from "./auth-forms";
function view(kind: "login" | "register") {
  const onSuccess = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        {kind === "login" ? (
          <LoginForm onSuccess={onSuccess} />
        ) : (
          <RegisterForm onSuccess={onSuccess} />
        )}
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { user: userEvent.setup(), onSuccess };
}
async function fillRegister(
  user: ReturnType<typeof userEvent.setup>,
  email = "new@example.test",
) {
  await user.type(screen.getByLabelText("Prénom"), "Test");
  await user.type(screen.getByLabelText("Nom", { exact: true }), "Fixture");
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(
    screen.getByLabelText("Mot de passe", { exact: true }),
    "Fixture-pass-123",
  );
}
it("logs in with accessible controls, reveal and normalized email, then clears fields", async () => {
  const { user, onSuccess } = view("login");
  await user.type(screen.getByLabelText("Email"), "test@example.test");
  const password = screen.getByLabelText("Mot de passe");
  expect(password).toHaveAttribute("autocomplete", "current-password");
  await user.type(password, "Fixture-pass-123");
  await user.click(
    screen.getByRole("button", { name: "Afficher mot de passe" }),
  );
  expect(password).toHaveAttribute("type", "text");
  await user.click(screen.getByRole("button", { name: "Se connecter" }));
  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  expect(password).toHaveValue("");
});
it.each(["invalid@example.test", "inactive@example.test"])(
  "keeps login errors generic for %s and retains only email",
  async (email) => {
    const { user, onSuccess } = view("login");
    await user.type(screen.getByLabelText("Email"), email);
    await user.type(
      screen.getByLabelText("Mot de passe"),
      email.startsWith("inactive") ? "Fixture-pass-123" : "wrong",
    );
    await user.click(screen.getByRole("button", { name: "Se connecter" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Connexion impossible avec ces identifiants.",
    );
    expect(screen.getByLabelText("Email")).toHaveValue(email);
    expect(screen.getByLabelText("Mot de passe")).toHaveValue("");
    expect(onSuccess).not.toHaveBeenCalled();
  },
);
it("registers without automatic login or sending confirmation", async () => {
  const { user, onSuccess } = view("register");
  await fillRegister(user);
  await user.click(screen.getByRole("button", { name: "Créer mon compte" }));
  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  expect(screen.getByLabelText("Email")).toHaveValue("");
});
it("handles duplicate email safely", async () => {
  const { user } = view("register");
  await fillRegister(user, "duplicate@example.test");
  await user.click(screen.getByRole("button", { name: "Créer mon compte" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Inscription impossible",
  );
  expect(screen.getByLabelText("Mot de passe", { exact: true })).toHaveValue(
    "",
  );
});
it("maps backend field errors and focuses the invalid field without displaying raw detail", async () => {
  const { user } = view("register");
  await fillRegister(user, "validation@example.test");
  await user.click(screen.getByRole("button", { name: "Créer mon compte" }));
  await waitFor(() => expect(screen.getByLabelText("Prénom")).toHaveFocus());
  expect(screen.getByLabelText("Prénom")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(screen.getByText("Vérifiez ce champ.")).toBeVisible();
});
it("shows a correlation reference for unexpected failure and rate limiting safely", async () => {
  const { user } = view("login");
  await user.type(screen.getByLabelText("Email"), "failure@example.test");
  await user.type(screen.getByLabelText("Mot de passe"), "Fixture-pass-123");
  await user.click(screen.getByRole("button", { name: "Se connecter" }));
  expect(await screen.findByText("auth-fixture-correlation")).toBeVisible();
  await user.clear(screen.getByLabelText("Email"));
  await user.type(screen.getByLabelText("Email"), "limited@example.test");
  await user.type(screen.getByLabelText("Mot de passe"), "Fixture-pass-123");
  await user.click(screen.getByRole("button", { name: "Se connecter" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("Trop de demandes"),
  );
});
it("prevents double submit while the login is pending", async () => {
  let release!: () => void;
  let count = 0;
  server.use(
    http.post(config.apiBaseUrl + "/api/auth/web/login", async () => {
      count++;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return HttpResponse.json({
        accessToken: "fixture",
        refreshToken: "fixture",
        tokenType: "Bearer",
        expiresIn: 900,
      });
    }),
  );
  const { user, onSuccess } = view("login");
  await user.type(screen.getByLabelText("Email"), "test@example.test");
  await user.type(screen.getByLabelText("Mot de passe"), "Fixture-pass-123");
  await user.dblClick(screen.getByRole("button", { name: "Se connecter" }));
  await waitFor(() => expect(count).toBe(1));
  release();
  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
});
