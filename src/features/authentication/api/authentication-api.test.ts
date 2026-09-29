import { expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/shared/testing/server";
import { config } from "@/shared/config/environment";
import { authenticationApi } from "./authentication-api";
import { createSession } from "../lib/session";
const input = { email: " Test@Example.test ", password: "Fixture-pass-123" };
it("sends exact normalized DTOs without bearer cookies or confirmation", async () => {
  let registration: unknown;
  let credentials: RequestCredentials | undefined;
  server.use(
    http.post(config.apiBaseUrl + "/api/auth/register", async ({ request }) => {
      registration = await request.json();
      credentials = request.credentials;
      expect(request.headers.has("Authorization")).toBe(false);
      return HttpResponse.json(
        {
          userId: "00000000-0000-4000-8000-000000000099",
          email: "test@example.test",
          firstName: "Test",
          lastName: "Fixture",
          status: "ACTIVE",
        },
        { status: 201 },
      );
    }),
  );
  await authenticationApi.register({
    ...input,
    firstName: "Test",
    lastName: "Fixture",
    confirmation: input.password,
  });
  expect(registration).toEqual({
    email: "test@example.test",
    password: input.password,
    firstName: "Test",
    lastName: "Fixture",
  });
  expect(credentials).toBe("omit");
});
it("uses cookie credentials and CSRF without exposing a refresh token", async () => {
  const original = await authenticationApi.login(input);
  expect(original).not.toHaveProperty("refreshToken");
  let seen = false;
  server.use(
    http.post(config.apiBaseUrl + "/api/auth/web/refresh", ({ request }) => {
      expect(request.credentials).toBe("include");
      expect(request.headers.get("X-XSRF-TOKEN")).toBe("fixture-csrf");
      expect(request.headers.has("Authorization")).toBe(false);
      seen = true;
      return HttpResponse.json({ ...original, accessToken: "rotated" });
    }),
  );
  expect((await authenticationApi.refresh()).accessToken).toBe("rotated");
  expect(seen).toBe(true);
  await authenticationApi.logout();
});
it("rejects malformed token payloads before creating an authenticated session", async () => {
  server.use(
    http.post(config.apiBaseUrl + "/api/auth/web/login", () =>
      HttpResponse.json({ tokenType: "Bearer", expiresIn: 900 }),
    ),
  );
  const session = createSession({ clearCache: () => {} });
  await expect(session.login(input)).rejects.toMatchObject({
    kind: "invalid-response",
  });
  expect(session.getSnapshot().status).toBe("anonymous");
});
it("presents network failures as technical failures, not invalid credentials", async () => {
  await expect(
    authenticationApi.login({ ...input, email: "network@example.test" }),
  ).rejects.toMatchObject({ kind: "network", status: 0 });
});
