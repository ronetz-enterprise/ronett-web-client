import { describe, it, expect, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/errors/api-error";
import type { httpClient } from "@/shared/api/http-client";
import { createSession } from "./session";
const initial = {
  accessToken: "fixture-access-1",
  refreshToken: "fixture-refresh-1",
  tokenType: "Bearer" as const,
  expiresIn: 900,
};
const rotated = {
  ...initial,
  accessToken: "fixture-access-2",
  refreshToken: "fixture-refresh-2",
};
const input = { email: " Test@Example.test ", password: "Fixture-pass-123" };
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function fixture(request = vi.fn(async () => ({ ok: true }))) {
  const api = {
    login: vi.fn(async () => initial),
    refresh: vi.fn(async () => rotated),
    logout: vi.fn(async () => {}),
    register: vi.fn(async () => {}),
  };
  const clearCache = vi.fn();
  const session = createSession({
    api,
    request: request as unknown as typeof httpClient,
    clearCache,
  });
  return { api, clearCache, session, request };
}
describe("memory session", () => {
  it("restores through cookies without persisting tokens or inventing a principal", async () => {
    const { session, api } = fixture();
    expect(session.getSnapshot().status).toBe("initializing");
    const local = vi.spyOn(Storage.prototype, "setItem");
    const stop = session.start();
    await session.restore();
    expect(session.getSnapshot()).toEqual({
      status: "authenticated",
      loginEmail: null,
      user: null,
    });
    expect(api.refresh).toHaveBeenCalledTimes(1);
    expect(api.refresh).toHaveBeenCalledWith();
    expect(local).not.toHaveBeenCalled();
    expect(JSON.stringify(session.getSnapshot())).not.toContain(
      "fixture-access",
    );
    stop();
  });
  it("distinguishes anonymous from temporary restoration failures and allows retry", async () => {
    const { session, api } = fixture();
    api.refresh.mockRejectedValueOnce(new ApiError("http", 401));
    await session.restore();
    expect(session.getSnapshot().status).toBe("anonymous");
    api.refresh.mockRejectedValueOnce(new ApiError("network"));
    await session.restore();
    expect(session.getSnapshot().status).toBe("unavailable");
    await session.restore();
    expect(session.getSnapshot().status).toBe("authenticated");
  });
  it("rejects invalid login and clears a previous user's cache", async () => {
    const { session, api, clearCache } = fixture();
    api.login.mockRejectedValueOnce(new ApiError("http", 401));
    await expect(session.login(input)).rejects.toMatchObject({ status: 401 });
    expect(session.getSnapshot().status).toBe("anonymous");
    expect(clearCache).toHaveBeenCalledTimes(1);
  });
  it("cancels queries and clears mutations and previous-user data on logout", async () => {
    const cache = new QueryClient();
    const api = fixture().api;
    const session = createSession({
      api,
      clearCache: () => {
        void cache.cancelQueries();
        cache.clear();
      },
    });
    await session.login(input);
    cache.setQueryData(["private", "previous"], { secret: true });
    let aborted = false;
    const pending = cache
      .fetchQuery({
        queryKey: ["pending"],
        queryFn: ({ signal }) =>
          new Promise((_resolve, reject) => {
            signal.addEventListener("abort", () => {
              aborted = true;
              reject(new Error("cancelled"));
            });
          }),
      })
      .catch(() => undefined);
    expect(await session.logout()).toEqual({ server: "revoked" });
    await pending;
    expect(aborted).toBe(true);
    expect(cache.getQueryCache().getAll()).toEqual([]);
    expect(cache.getMutationCache().getAll()).toEqual([]);
    expect(api.logout).toHaveBeenCalledWith();
    expect(session.getSnapshot().loginEmail).toBeNull();
  });
  it("reports unconfirmed server logout while removing local access", async () => {
    const { session, api } = fixture();
    await session.login(input);
    api.logout.mockRejectedValueOnce(new ApiError("network"));
    expect(await session.logout()).toEqual({ server: "unconfirmed" });
    await expect(session.request("/api/resource")).rejects.toMatchObject({
      status: 401,
    });
    expect(await session.logout()).toEqual({ server: "no-session" });
  });
  it("discards login and successful read responses arriving after logout", async () => {
    const pendingLogin = deferred<typeof initial>();
    const pendingRead = deferred<{ ok: boolean }>();
    const { session, api } = fixture(vi.fn(() => pendingRead.promise));
    api.login.mockReturnValueOnce(pendingLogin.promise);
    const login = session.login(input);
    const loggedOut = session.logout();
    const cancelled = expect(login).rejects.toMatchObject({ kind: "aborted" });
    pendingLogin.resolve(initial);
    await loggedOut;
    await cancelled;
    expect(api.logout).toHaveBeenCalledOnce();
    await session.login(input);
    const read = session.request("/api/resource");
    await session.logout();
    pendingRead.resolve({ ok: true });
    await expect(read).rejects.toMatchObject({ kind: "aborted" });
    expect(session.getSnapshot().status).toBe("anonymous");
  });
});
describe("coordinated refresh", () => {
  it("uses a valid access token without refresh", async () => {
    const { session, api, request } = fixture();
    await session.login(input);
    await session.request("/api/resource");
    expect(api.refresh).not.toHaveBeenCalled();
    expect(request).toHaveBeenCalledWith(
      "/api/resource",
      expect.objectContaining({ accessToken: initial.accessToken }),
    );
  });
  it("shares one refresh across five 401s and replays five reads once", async () => {
    const request = vi.fn(
      async (_path?: string, options?: { accessToken?: string }) => {
        if (options?.accessToken === initial.accessToken)
          throw new ApiError("http", 401);
        return { ok: true };
      },
    );
    const { session, api } = fixture(request);
    await session.login(input);
    await expect(
      Promise.all(
        Array.from({ length: 5 }, () => session.request("/api/resource")),
      ),
    ).resolves.toHaveLength(5);
    expect(api.refresh).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledTimes(10);
  });
  it("does not rotate again for a late 401 from the previous access token", async () => {
    const late = deferred<{ ok: boolean }>();
    const request = vi.fn(async () => ({ ok: true }));
    request
      .mockImplementationOnce(() => late.promise)
      .mockRejectedValueOnce(new ApiError("http", 401));
    const { session, api } = fixture(request);
    await session.login(input);
    const first = session.request("/api/slow");
    await session.request("/api/fast");
    late.reject(new ApiError("http", 401));
    await first;
    expect(api.refresh).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledTimes(4);
  });
  it.each(["POST", "PUT", "PATCH", "DELETE"])(
    "does not replay a %s mutation",
    async (method) => {
      const request = vi.fn(async () => {
        throw new ApiError("http", 401);
      });
      const { session, api } = fixture(request);
      await session.login(input);
      await expect(
        session.request("/api/resource", { method, body: { value: "test" } }),
      ).rejects.toMatchObject({ status: 401 });
      expect(request).toHaveBeenCalledTimes(1);
      expect(api.refresh).toHaveBeenCalledTimes(1);
    },
  );
  it.each(["expired", "revoked", "network"])(
    "clears session on %s refresh failure without loops",
    async (reason) => {
      const request = vi.fn(async () => {
        throw new ApiError("http", 401);
      });
      const { session, api, clearCache } = fixture(request);
      api.refresh.mockRejectedValueOnce(
        new ApiError(
          reason === "network" ? "network" : "http",
          reason === "network" ? 0 : 401,
        ),
      );
      await session.login(input);
      await Promise.allSettled(
        Array.from({ length: 5 }, () => session.request("/api/resource")),
      );
      expect(session.getSnapshot().status).toBe(
        reason === "network" ? "unavailable" : "expired",
      );
      expect(session.getSnapshot().loginEmail).toBeNull();
      expect(api.refresh).toHaveBeenCalledTimes(1);
      expect(clearCache).toHaveBeenCalledTimes(2);
      await expect(session.request("/api/resource")).rejects.toMatchObject({
        status: 401,
      });
      expect(api.refresh).toHaveBeenCalledTimes(1);
    },
  );
  it("stops after a second 401 and excludes authentication endpoints", async () => {
    const request = vi.fn(async () => {
      throw new ApiError("http", 401);
    });
    const { session, api } = fixture(request);
    await session.login(input);
    await expect(session.request("/api/auth/refresh")).rejects.toThrow(
      "Chemin",
    );
    await expect(session.request("/api/resource")).rejects.toMatchObject({
      status: 401,
    });
    expect(request).toHaveBeenCalledTimes(2);
    expect(api.refresh).toHaveBeenCalledTimes(1);
    expect(session.getSnapshot().status).toBe("expired");
  });
  it("ignores late rotation after logout and revokes its originating session", async () => {
    const pending = deferred<typeof initial>();
    const { session, api } = fixture();
    await session.login(input);
    api.refresh.mockReturnValueOnce(pending.promise);
    const refresh = session.refresh();
    const loggedOut = session.logout();
    const rejected = expect(refresh).rejects.toMatchObject({ kind: "aborted" });
    pending.resolve(rotated);
    await loggedOut;
    await rejected;
    await expect(refresh).rejects.toMatchObject({ kind: "aborted" });
    expect(session.getSnapshot().status).toBe("anonymous");
    expect(api.logout).toHaveBeenCalledWith();
  });
  it("refreshes at expiry, then transitions to expired when renewal is refused", async () => {
    vi.useFakeTimers();
    const { session, api } = fixture();
    const stop = session.start();
    try {
      await session.restore();
      api.refresh.mockClear();
      await session.login(input);
      api.refresh.mockRejectedValueOnce(new ApiError("http", 401));
      await vi.advanceTimersByTimeAsync(900000);
      expect(api.refresh).toHaveBeenCalledTimes(1);
      expect(session.getSnapshot().status).toBe("expired");
    } finally {
      stop();
      vi.useRealTimers();
    }
  });
  it("does not replay an aborted caller after a shared refresh", async () => {
    const pending = deferred<typeof initial>();
    const request = vi.fn(async () => {
      throw new ApiError("http", 401);
    });
    const { session, api } = fixture(request);
    api.refresh.mockReturnValueOnce(pending.promise);
    await session.login(input);
    const controller = new AbortController();
    const read = session.request("/api/resource", {
      signal: controller.signal,
    });
    await Promise.resolve();
    controller.abort();
    pending.resolve(rotated);
    await expect(read).rejects.toMatchObject({ kind: "aborted" });
    expect(request).toHaveBeenCalledTimes(1);
  });
});

it("shares logout requests and blocks login until revocation has settled", async () => {
  const pending = deferred<void>();
  const { session, api } = fixture();
  await session.login(input);
  api.logout.mockReturnValueOnce(pending.promise);
  const first = session.logout();
  const second = session.logout();
  expect(first).toBe(second);
  await expect(session.login(input)).rejects.toMatchObject({ kind: "aborted" });
  expect(api.logout).toHaveBeenCalledTimes(1);
  pending.resolve();
  await first;
  await session.login(input);
  expect(session.getSnapshot().status).toBe("authenticated");
});
it("a failed refresh from a previous session cannot clear a newer login", async () => {
  const pending = deferred<typeof initial>();
  const { session, api } = fixture();
  await session.login(input);
  api.refresh.mockReturnValueOnce(pending.promise);
  const refresh = session.refresh();
  await session.login({ ...input, email: "next@example.test" });
  pending.reject(new ApiError("http", 401));
  await expect(refresh).rejects.toMatchObject({ status: 401 });
  expect(session.getSnapshot()).toMatchObject({
    status: "authenticated",
    loginEmail: "next@example.test",
  });
});
it("never refreshes forbidden or rate-limited resource requests", async () => {
  const request = vi.fn(async () => ({ ok: true }));
  request
    .mockRejectedValueOnce(new ApiError("http", 403))
    .mockRejectedValueOnce(new ApiError("http", 429));
  const { session, api } = fixture(request);
  await session.login(input);
  await expect(session.request("/api/resource")).rejects.toMatchObject({
    status: 403,
  });
  await expect(session.request("/api/resource")).rejects.toMatchObject({
    status: 429,
  });
  expect(api.refresh).not.toHaveBeenCalled();
});

it("does not rotate twice when the backend returns an identical access token", async () => {
  const late = deferred<{ ok: boolean }>();
  const request = vi.fn(async () => ({ ok: true }));
  request
    .mockImplementationOnce(() => late.promise)
    .mockRejectedValueOnce(new ApiError("http", 401));
  const { session, api } = fixture(request);
  api.refresh.mockResolvedValue({
    ...rotated,
    accessToken: initial.accessToken,
  });
  await session.login(input);
  const slow = session.request("/api/slow");
  await session.request("/api/fast");
  late.reject(new ApiError("http", 401));
  await slow;
  expect(api.refresh).toHaveBeenCalledTimes(1);
});
