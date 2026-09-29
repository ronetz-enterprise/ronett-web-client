import { z } from "zod";
import { httpClient } from "@/shared/api/http-client";
import { ApiError } from "@/shared/errors/api-error";
import {
  normalizeEmail,
  tokenSchema,
  type LoginInput,
  type RegisterInput,
} from "../schemas/authentication";
const csrfSchema = z.object({
  headerName: z.literal("X-XSRF-TOKEN"),
  token: z.string().min(1),
});
async function web(path: string, body?: unknown) {
  const csrf = csrfSchema.safeParse(
    await httpClient("/api/auth/web/csrf", { credentials: "include" }),
  );
  if (!csrf.success) throw new ApiError("invalid-response");
  return httpClient(path, {
    method: "POST",
    credentials: "include",
    headers: { [csrf.data.headerName]: csrf.data.token },
    ...(body === undefined ? {} : { body }),
  });
}
async function tokens(path: string, body?: unknown) {
  const result = tokenSchema.safeParse(await web(path, body));
  if (!result.success) throw new ApiError("invalid-response");
  return result.data;
}
// Serialise cookie rotations across tabs as well as within a session provider.
async function locked<T>(run: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks)
    return navigator.locks.request("ronetz-web-session", run);
  return run();
}
export const authenticationApi = {
  login: (input: LoginInput) =>
    locked(() =>
      tokens("/api/auth/web/login", {
        email: normalizeEmail(input.email),
        password: input.password,
      }),
    ),
  refresh: () => locked(() => tokens("/api/auth/web/refresh")),
  logout: () =>
    locked(async () => {
      await web("/api/auth/web/logout");
    }),
  register: async (input: RegisterInput) => {
    await httpClient("/api/auth/register", {
      method: "POST",
      body: {
        email: normalizeEmail(input.email),
        firstName: input.firstName,
        lastName: input.lastName,
        password: input.password,
      },
    });
  },
};
