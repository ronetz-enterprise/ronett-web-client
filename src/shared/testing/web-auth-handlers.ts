import { http, HttpResponse } from "msw";
import { config } from "@/shared/config/environment";
import {
  fixtureEmail,
  fixtureRecord,
  resetTenantFixtures,
} from "./tenant-fixtures";
let email: string | undefined;
let sequence = 0;
const revoked = new Set<string>();
function problem(status: number, code = "AUTHENTICATION_REQUIRED") {
  return HttpResponse.json(
    {
      title: "Request failed",
      status,
      code,
      type: "https://api.ronetz.com/problems/invalid-credentials",
      correlationId: "auth-fixture-correlation",
    },
    { status },
  );
}
function readCookie() {
  if (typeof document === "undefined") return email;
  const value = document.cookie
    .split("; ")
    .find((v) => v.startsWith("msw_session="))
    ?.slice(12);
  return value ? decodeURIComponent(value) : email;
}
function setCookie(value: string) {
  email = value || undefined;
  if (typeof document !== "undefined")
    document.cookie =
      "msw_session=" + encodeURIComponent(value) + "; Path=/; SameSite=Strict";
}
function tokens(user: string) {
  return {
    accessToken: "fixture-access-" + user + "|" + ++sequence,
    tokenType: "Bearer",
    expiresIn: user === "expired@example.test" ? 2 : 900,
  };
}
export function resetWebFixtures() {
  setCookie("");
  revoked.clear();
  resetTenantFixtures();
  if (typeof sessionStorage !== "undefined") sessionStorage.clear();
}
const base = config.apiBaseUrl;
export const webAuthHandlers = [
  http.get(base + "/api/auth/web/csrf", () =>
    HttpResponse.json({ headerName: "X-XSRF-TOKEN", token: "fixture-csrf" }),
  ),
  http.post(base + "/api/auth/web/login", async ({ request }) => {
    if (request.headers.get("X-XSRF-TOKEN") !== "fixture-csrf")
      return problem(403, "ACCESS_DENIED");
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === "network@example.test") return HttpResponse.error();
    if (body.email === "limited@example.test") return problem(429);
    if (body.email === "failure@example.test") return problem(500);
    if (
      body.password !== "Fixture-pass-123" ||
      body.email === "inactive@example.test"
    )
      return problem(401);
    setCookie(body.email);
    revoked.delete(body.email);
    fixtureRecord(body.email);
    return HttpResponse.json(tokens(body.email));
  }),
  http.post(base + "/api/auth/web/refresh", ({ request }) => {
    if (request.headers.get("X-XSRF-TOKEN") !== "fixture-csrf")
      return problem(403, "ACCESS_DENIED");
    const user = readCookie();
    if (!user || user === "expired@example.test" || revoked.has(user))
      return problem(401);
    return HttpResponse.json(tokens(user));
  }),
  http.post(base + "/api/auth/web/logout", ({ request }) => {
    if (request.headers.get("X-XSRF-TOKEN") !== "fixture-csrf")
      return problem(403, "ACCESS_DENIED");
    const user = readCookie();
    if (user === "logout-failure@example.test") return HttpResponse.error();
    if (user) revoked.add(user);
    setCookie("");
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(base + "/api/me", ({ request }) => {
    const user = fixtureEmail(request);
    if (!user || revoked.has(user)) return problem(401);
    return HttpResponse.json({
      userId: user.startsWith("next")
        ? "00000000-0000-4000-8000-000000000098"
        : "00000000-0000-4000-8000-000000000099",
      email: user,
      firstName: "Test",
      lastName: "Fixture",
      status: "ACTIVE",
      platformAdmin: false,
    });
  }),
  // La console plateforme n'est pas simulee en fixture : un compte ordinaire
  // y recoit le meme refus que la plateforme reelle.
  http.get(base + "/api/platform/session", ({ request }) => {
    const user = fixtureEmail(request);
    if (!user || revoked.has(user)) return problem(401);
    return problem(403, "PLATFORM_ADMIN_FORBIDDEN");
  }),
  http.get(base + "/api/platform/dashboard", ({ request }) => {
    const user = fixtureEmail(request);
    if (!user || revoked.has(user)) return problem(401);
    return problem(403, "PLATFORM_ADMIN_FORBIDDEN");
  }),
  http.get(base + "/api/platform/organizations", ({ request }) => {
    const user = fixtureEmail(request);
    if (!user || revoked.has(user)) return problem(401);
    return problem(403, "PLATFORM_ADMIN_FORBIDDEN");
  }),
  http.get(base + "/api/platform/sites", ({ request }) => {
    const user = fixtureEmail(request);
    if (!user || revoked.has(user)) return problem(401);
    return problem(403, "PLATFORM_ADMIN_FORBIDDEN");
  }),
  http.get(base + "/api/platform/routers", ({ request }) => {
    const user = fixtureEmail(request);
    if (!user || revoked.has(user)) return problem(401);
    return problem(403, "PLATFORM_ADMIN_FORBIDDEN");
  }),
  http.get(base + "/api/platform/audit-entries", ({ request }) => {
    const user = fixtureEmail(request);
    if (!user || revoked.has(user)) return problem(401);
    return problem(403, "PLATFORM_ADMIN_FORBIDDEN");
  }),
  http.get(base + "/api/me/memberships", ({ request }) => {
    const user = fixtureEmail(request);
    if (!user || revoked.has(user)) return problem(401);
    if (user.startsWith("list-error")) return problem(503);
    return HttpResponse.json({ items: fixtureRecord(user).items });
  }),
  http.get(base + "/api/me/memberships/:id", ({ request, params }) => {
    const user = fixtureEmail(request);
    if (!user || revoked.has(user)) return problem(401);
    const item = fixtureRecord(user).items.find(
      (m) => m.organizationId === params.id,
    );
    if (!item) return problem(403, "ORGANIZATION_ACCESS_DENIED");
    if (item.membershipStatus !== "ACTIVE")
      return problem(403, "MEMBERSHIP_" + item.membershipStatus);
    if (item.organizationStatus !== "ACTIVE")
      return problem(403, "ORGANIZATION_" + item.organizationStatus);
    return HttpResponse.json(item);
  }),
];
