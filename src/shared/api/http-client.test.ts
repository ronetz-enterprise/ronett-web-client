import { expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { createHttpClient } from "./http-client";
import { server } from "@/shared/testing/server";
import { mockCorrelationId } from "@/shared/testing/handlers";
import { ApiError } from "@/shared/errors/api-error";
const request = createHttpClient("http://localhost:8080");
it("reads JSON, 204 and non-JSON success", async () => {
  await expect(request("/__mocks/success")).resolves.toEqual({ ok: true });
  await expect(request("/__mocks/empty")).resolves.toBeUndefined();
  await expect(request("/__mocks/text")).resolves.toBe("résultat technique");
});
it.each([401, 403, 404, 409, 422, 429, 500, 502, 503])(
  "normalizes HTTP %i with the original correlation",
  async (status) => {
    await expect(request(`/__mocks/${status}`)).rejects.toMatchObject({
      kind: "http",
      status,
      correlationId: mockCorrelationId,
    });
  },
);
it("extracts validation errors", async () => {
  await expect(request("/__mocks/validation")).rejects.toMatchObject({
    status: 400,
    problem: { errors: [{ field: "label", message: "must not be blank" }] },
  });
});
it("normalizes HTML error and malformed success JSON", async () => {
  server.use(
    http.get(
      "*/html",
      () =>
        new HttpResponse("<html>internal secret</html>", {
          status: 500,
          headers: { "X-Correlation-Id": "html-id" },
        }),
    ),
    http.get(
      "*/broken",
      () =>
        new HttpResponse("{", {
          headers: { "Content-Type": "application/json" },
        }),
    ),
  );
  await expect(request("/html")).rejects.toMatchObject({
    kind: "http",
    status: 500,
    correlationId: "html-id",
    problem: undefined,
  });
  await expect(request("/broken")).rejects.toMatchObject({
    kind: "invalid-response",
  });
});
it("distinguishes network failure, timeout and caller abort", async () => {
  await expect(request("/__mocks/network")).rejects.toMatchObject({
    kind: "network",
  });
  await expect(
    request("/__mocks/timeout", { timeoutMs: 10 }),
  ).rejects.toMatchObject({ kind: "timeout" });
  const controller = new AbortController();
  const pending = request("/__mocks/timeout", { signal: controller.signal });
  controller.abort();
  await expect(pending).rejects.toMatchObject({ kind: "aborted" });
  await expect(
    request("/__mocks/success", { signal: controller.signal }),
  ).rejects.toMatchObject({ kind: "aborted" });
});
it("sets bearer only on explicit demand, omits cookies and tenant headers, never generates correlation", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  server.use(
    http.post("*/echo", async ({ request: req }) => {
      expect(req.headers.get("Authorization")).toBe("Bearer test-only");
      expect(req.headers.get("Content-Type")).toBe("application/json");
      expect(req.headers.get("X-Correlation-Id")).toBeNull();
      expect(req.headers.get("organizationId")).toBeNull();
      expect(await req.json()).toEqual({ label: "demo" });
      return HttpResponse.json({ ok: true });
    }),
  );
  await request("/echo", {
    method: "POST",
    body: { label: "demo" },
    accessToken: "test-only",
  });
  expect(fetchSpy).toHaveBeenCalledWith(
    "http://localhost:8080/echo",
    expect.objectContaining({
      credentials: "omit",
      redirect: "error",
      cache: "no-store",
    }),
  );
});
it("does not replay POST or accept another origin", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  server.use(
    http.post("*/mutation", () => HttpResponse.json({}, { status: 503 })),
  );
  await expect(request("/mutation", { method: "POST" })).rejects.toBeInstanceOf(
    ApiError,
  );
  expect(fetchSpy).toHaveBeenCalledTimes(1);
  await expect(
    request("//untrusted.test", { accessToken: "test-only" }),
  ).rejects.toThrow("Chemin API relatif");
});
