import { httpClient, type RequestOptions } from "@/shared/api/http-client";
import { ApiError } from "@/shared/errors/api-error";
import { authenticationApi } from "../api/authentication-api";
import {
  normalizeEmail,
  type LoginInput,
  type Tokens,
} from "../schemas/authentication";
export type SessionStatus =
  | "initializing"
  | "authenticated"
  | "anonymous"
  | "refreshing"
  | "expired"
  | "unavailable";
export type SessionSnapshot = {
  status: SessionStatus;
  // Transport state only; verified principal is held in TanStack Query.
  loginEmail: string | null;
  user: null;
};
export type LogoutResult = { server: "revoked" | "unconfirmed" | "no-session" };
type Dependencies = {
  api?: typeof authenticationApi;
  request?: typeof httpClient;
  clearCache: () => void;
};
export function createSession({
  api = authenticationApi,
  request = httpClient,
  clearCache,
}: Dependencies) {
  let snapshot: SessionSnapshot = {
    status: "initializing",
    loginEmail: null,
    user: null,
  };
  let credentials: Tokens | undefined;
  let epoch = 0;
  let revision = 0;
  let rotation: Promise<void> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let active = false;
  let deadline = 0;
  let loginOperation: Promise<Tokens> | undefined;
  let logoutOperation: Promise<LogoutResult> | undefined;
  const listeners = new Set<() => void>();
  const requests = new Set<AbortController>();
  const publish = (status: SessionStatus, loginEmail = snapshot.loginEmail) => {
    snapshot = { status, loginEmail, user: null };
    listeners.forEach((listener) => listener());
  };
  function clear(status: "anonymous" | "expired" | "unavailable") {
    epoch++;
    credentials = undefined;
    rotation = undefined;
    clearTimeout(timer);
    requests.forEach((controller) => controller.abort());
    requests.clear();
    clearCache();
    publish(status, null);
  }
  function check(expected: number) {
    if (expected !== epoch) throw new ApiError("aborted");
  }
  function schedule() {
    clearTimeout(timer);
    if (active && credentials)
      timer = setTimeout(
        () => {
          void refresh().catch(() => {});
        },
        Math.max(0, deadline - Date.now()),
      );
  }
  function accept(tokens: Tokens, loginEmail = snapshot.loginEmail) {
    credentials = tokens;
    revision++;
    deadline = Date.now() + tokens.expiresIn * 1000;
    publish("authenticated", loginEmail);
    schedule();
  }
  function refresh(): Promise<void> {
    if (rotation) return rotation;
    if (!credentials) return Promise.reject(new ApiError("http", 401));
    const expected = epoch;

    // Defer invocation so even a synchronous mock failure is handled by the same promise.
    const pending = Promise.resolve()
      .then(() => api.refresh())
      .then((tokens) => {
        check(expected);
        accept(tokens);
      })
      .catch((error: unknown) => {
        if (expected === epoch)
          clear(
            error instanceof ApiError && error.status === 401
              ? "expired"
              : "unavailable",
          );
        throw error;
      })
      .finally(() => {
        if (rotation === pending) rotation = undefined;
      });
    rotation = pending;
    publish("refreshing");
    return pending;
  }
  let restoration: Promise<void> | undefined;
  function restore(): Promise<void> {
    if (restoration) return restoration;
    const expected = epoch;
    publish("initializing");
    const pending = Promise.resolve()
      .then(() => api.refresh())
      .then((tokens) => {
        check(expected);
        accept(tokens);
      })
      .catch((error: unknown) => {
        if (expected === epoch)
          clear(
            error instanceof ApiError && error.status === 401
              ? "anonymous"
              : "unavailable",
          );
      })
      .finally(() => {
        if (restoration === pending) restoration = undefined;
      });
    restoration = pending;
    return pending;
  }
  return {
    restore,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    start() {
      active = true;
      if (snapshot.status === "initializing") void restore();
      schedule();
      return () => {
        active = false;
        clearTimeout(timer);
      };
    },
    async login(input: LoginInput) {
      if (logoutOperation) throw new ApiError("aborted");
      clear("anonymous");
      const expected = epoch;
      const pending = api.login(input);
      loginOperation = pending;
      try {
        const tokens = await pending;
        check(expected);
        accept(tokens, normalizeEmail(input.email));
      } finally {
        if (loginOperation === pending) loginOperation = undefined;
      }
    },
    refresh,
    logout(): Promise<LogoutResult> {
      if (logoutOperation) return logoutOperation;
      const hasSession =
        !!credentials ||
        !!loginOperation ||
        !!restoration ||
        snapshot.status === "unavailable";
      const pendingRotation = Promise.allSettled([
        rotation,
        restoration,
        loginOperation,
      ]);
      const pending = Promise.resolve()
        .then(async (): Promise<LogoutResult> => {
          if (!hasSession) return { server: "no-session" };
          try {
            await pendingRotation?.catch(() => {});
            await api.logout();
            return { server: "revoked" };
          } catch {
            return { server: "unconfirmed" };
          }
        })
        .finally(() => {
          if (logoutOperation === pending) logoutOperation = undefined;
        });
      logoutOperation = pending;
      // Local access ends immediately, even if the revocation request fails.
      clear("anonymous");
      return pending;
    },
    async request<T = unknown>(
      path: string,
      options: Omit<RequestOptions, "accessToken"> = {},
    ): Promise<T> {
      if (
        !path.startsWith("/api/") ||
        path === "/api/auth" ||
        path.startsWith("/api/auth/") ||
        /[%\\?#\s]/.test(path) ||
        path.split("/").some((part) => part === "." || part === "..")
      )
        throw new Error("Chemin de ressource authentifiée requis.");
      if (!credentials) throw new ApiError("http", 401);
      const expected = epoch;
      const controller = new AbortController();
      const abort = () => controller.abort();
      options.signal?.addEventListener("abort", abort, { once: true });
      if (options.signal?.aborted) abort();
      requests.add(controller);
      const checkRequest = () => {
        check(expected);
        if (controller.signal.aborted) throw new ApiError("aborted");
      };
      const invoke = async () => {
        checkRequest();
        const value = await request<T>(path, {
          ...options,
          signal: controller.signal,
          accessToken: credentials?.accessToken,
        });
        checkRequest();
        return value;
      };
      try {
        if (rotation || Date.now() >= deadline) await refresh();
        checkRequest();
        const usedRevision = revision;
        try {
          return await invoke();
        } catch (error) {
          checkRequest();
          if (!(error instanceof ApiError) || error.status !== 401) throw error;
          if (usedRevision === revision) await refresh();
          else if (rotation) await rotation;
          checkRequest();
          if (
            !["GET", "HEAD"].includes((options.method ?? "GET").toUpperCase())
          )
            throw error;
          try {
            return await invoke();
          } catch (retryError) {
            if (
              expected === epoch &&
              retryError instanceof ApiError &&
              retryError.status === 401
            )
              clear("expired");
            throw retryError;
          }
        }
      } finally {
        requests.delete(controller);
        options.signal?.removeEventListener("abort", abort);
      }
    },
  };
}
export type Session = ReturnType<typeof createSession>;
