// Synthetic HTTP fixtures only. No real JWT, identity lookup or cookie contract.
import { http, HttpResponse } from "msw";
import { config } from "@/shared/config/environment";
const base = config.apiBaseUrl;
let sequence = 0;
const sessions = new Map<
  string,
  { revoked: boolean; refuseRefresh: boolean; failLogout: boolean }
>();
const refreshTokens = new Map<string, { session: string; used: boolean }>();
export function resetAuthFixtures() {
  sequence = 0;
  sessions.clear();
  refreshTokens.clear();
}
function problem(
  status: number,
  type: string,
  errors?: { field: string; message: string }[],
) {
  return HttpResponse.json(
    {
      type: "https://api.ronetz.com/problems/" + type,
      title: "Request failed",
      status,
      correlationId: "auth-fixture-correlation",
      ...(errors ? { errors } : {}),
    },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}
function tokens(session: string, expiresIn = 900) {
  const id = ++sequence;
  const refreshToken = "fixture-refresh-" + id;
  refreshTokens.set(refreshToken, { session, used: false });
  return {
    accessToken: "fixture-access-" + id,
    refreshToken,
    tokenType: "Bearer",
    expiresIn,
  };
}
export const authHandlers = [
  http.post(base + "/api/auth/register", async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    if (body.email === "duplicate@example.test")
      return problem(409, "email-already-used");
    if (body.email === "validation@example.test")
      return problem(400, "validation-error", [
        { field: "firstName", message: "Invalid" },
      ]);
    if (
      !body.firstName ||
      !body.lastName ||
      !body.email ||
      body.password?.length < 8 ||
      new TextEncoder().encode(body.password).length > 72 ||
      "confirmation" in body
    )
      return problem(400, "invalid-registration");
    return HttpResponse.json(
      {
        userId: "00000000-0000-4000-8000-000000000099",
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        status: "ACTIVE",
      },
      {
        status: 201,
        headers: {
          Location: "/api/identities/00000000-0000-4000-8000-000000000099",
        },
      },
    );
  }),
  http.post(base + "/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    if (body.email === "network@example.test") return HttpResponse.error();
    if (body.email === "limited@example.test")
      return problem(429, "too-many-requests");
    if (body.email === "failure@example.test")
      return problem(500, "internal-error");
    if (
      body.password !== "Fixture-pass-123" ||
      body.email === "inactive@example.test"
    )
      return problem(401, "invalid-credentials");
    const session = "fixture-session-" + ++sequence;
    const refuseRefresh = body.email === "expired@example.test";
    sessions.set(session, {
      revoked: false,
      refuseRefresh,
      failLogout: body.email === "logout-failure@example.test",
    });
    return HttpResponse.json(tokens(session, refuseRefresh ? 2 : 900));
  }),
  http.post(base + "/api/auth/refresh", async ({ request }) => {
    const { refreshToken } = (await request.json()) as { refreshToken: string };
    const token = refreshTokens.get(refreshToken);
    const session = token && sessions.get(token.session);
    if (
      !token ||
      token.used ||
      !session ||
      session.revoked ||
      session.refuseRefresh
    )
      return problem(401, "invalid-credentials");
    token.used = true;
    return HttpResponse.json(tokens(token.session));
  }),
  http.post(base + "/api/auth/logout", async ({ request }) => {
    const { refreshToken } = (await request.json()) as { refreshToken: string };
    const token = refreshTokens.get(refreshToken);
    const session = token && sessions.get(token.session);
    if (session?.failLogout) return HttpResponse.error();
    if (session) session.revoked = true;
    return new HttpResponse(null, { status: 204 });
  }),
];
