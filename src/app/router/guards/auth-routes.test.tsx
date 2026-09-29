import ForbiddenPage from "@/pages/public/forbidden-page";
import { useEffect } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Routes, Route, useLocation } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it } from "vitest";
import { AuthProvider, useAuth } from "@/features/authentication";
import AuthenticatedRoute from "./authenticated-route";
import PublicOnlyRoute from "./public-only-route";
function Location() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname + location.search}</p>;
}
function SignedIn({ children }: { children: React.ReactNode }) {
  const { login, status } = useAuth();
  useEffect(() => {
    void login({ email: "test@example.test", password: "Fixture-pass-123" });
  }, [login]);
  return status === "authenticated" ? children : null;
}
function App({ path, signedIn = false }: { path: string; signedIn?: boolean }) {
  const routes = (
    <MemoryRouter initialEntries={[path]}>
      <Location />
      <Routes>
        <Route element={<AuthenticatedRoute />}>
          <Route path="/account" element={<h1>Private</h1>} />
          <Route path="/platform-admin" element={<ForbiddenPage />} />
        </Route>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/auth/login" element={<h1>Login</h1>} />
          <Route path="/auth/register" element={<h1>Register</h1>} />
        </Route>
        <Route path="/organizations/select" element={<h1>Onboarding</h1>} />
      </Routes>
    </MemoryRouter>
  );
  return (
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        {signedIn ? <SignedIn>{routes}</SignedIn> : routes}
      </AuthProvider>
    </QueryClientProvider>
  );
}
it("renders only neutral loading on the server, never protected content", () => {
  const html = renderToString(<App path="/account" />);
  expect(html).toContain("Chargement");
  expect(html).not.toContain("<h1>Private");
});
it.each([
  ["/auth/login", "Login"],
  ["/auth/register", "Register"],
])("allows public auth route %s", async (path, title) => {
  render(<App path={path} />);
  expect(await screen.findByRole("heading", { name: title })).toBeVisible();
});
it("redirects visitors with a safe return path", async () => {
  render(<App path="/account" />);
  expect(await screen.findByRole("heading", { name: "Login" })).toBeVisible();
  expect(screen.getByTestId("location")).toHaveTextContent(
    "/auth/login?returnTo=%2Faccount",
  );
});
it("allows an authenticated session into its protected placeholder", async () => {
  render(<App path="/account" signedIn />);
  expect(await screen.findByRole("heading", { name: "Private" })).toBeVisible();
});
it("redirects authenticated visitors away from login without accepting an external URL", async () => {
  render(<App path="/auth/login?returnTo=https://evil.test" signedIn />);
  await waitFor(() =>
    expect(screen.getByRole("heading", { name: "Onboarding" })).toBeVisible(),
  );
});

it("denies the platform placeholder even for an authenticated session", async () => {
  render(<App path="/platform-admin" signedIn />);
  expect(
    await screen.findByRole("heading", { name: "Accès interdit" }),
  ).toBeVisible();
});
