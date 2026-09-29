import { it, expect, vi } from "vitest";
import { ApiError } from "@/shared/errors/api-error";
import { createAttempt } from "./creation-attempt";
import { createOrganization } from "../api/create-organization";
import type { AuthenticatedRequest } from "../api/create-organization";
import { createOrganizationSchema } from "../schemas/create-organization";
const organization = {
  id: "00000000-0000-4000-8000-000000000010",
  name: "Fixture",
  currency: "XAF",
  status: "ACTIVE",
  suspensionReason: null,
  suspendedAt: null,
  closedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};
const input = { name: " Fixture ", currency: " xaf " };
function fixture() {
  const request = vi.fn(async () => organization);
  return {
    request,
    attempt: createAttempt(request as unknown as AuthenticatedRequest),
  };
}
it("validates only name and currency format; the server decides the currency catalog", () => {
  expect(createOrganizationSchema.safeParse(input).success).toBe(true);
  for (const patch of [
    { name: "" },
    { name: " " },
    { name: "x".repeat(151) },
    { currency: "" },
    { currency: "XAFR" },
  ])
    expect(
      createOrganizationSchema.safeParse({ ...input, ...patch }).success,
    ).toBe(false);
  expect(
    createOrganizationSchema.safeParse({ ...input, currency: "ZZZ" }).success,
  ).toBe(true);
});
it("sends exact HTTP DTO with verified idempotency header and without role or userId", async () => {
  const { request } = fixture();
  const result = await createOrganization(
    request as unknown as AuthenticatedRequest,
    input,
    "00000000-0000-4000-8000-000000000030",
  );
  expect(result).toEqual(organization);
  expect(request).toHaveBeenCalledWith("/api/organizations", {
    method: "POST",
    headers: { "Idempotency-Key": "00000000-0000-4000-8000-000000000030" },
    body: { name: "Fixture", currency: "XAF" },
  });
});
it("blocks concurrent creates and additional creates after success without inventing membership", async () => {
  const { request, attempt } = fixture();
  const first = attempt.submit(input);
  expect(attempt.getSnapshot().status).toBe("creating");
  expect(await attempt.submit(input)).toBe(false);
  await first;
  expect(attempt.getSnapshot().status).toBe("created");
  expect(attempt.getSnapshot()).not.toHaveProperty("membership");
  expect(await attempt.submit(input)).toBe(false);
  expect(request).toHaveBeenCalledTimes(1);
});
it.each(["network", "timeout", "aborted", "invalid-response"] as const)(
  "locks an uncertain %s result without replay",
  async (kind) => {
    const { request, attempt } = fixture();
    request.mockRejectedValueOnce(new ApiError(kind));
    await attempt.submit(input);
    expect(attempt.getSnapshot().status).toBe("unknown");
    expect(await attempt.submit(input)).toBe(false);
    expect(request).toHaveBeenCalledTimes(1);
  },
);
it.each([400, 403, 404, 422, 429])(
  "permits a manual correction after explicit HTTP %s rejection",
  async (status) => {
    const { request, attempt } = fixture();
    request.mockRejectedValueOnce(new ApiError("http", status));
    await attempt.submit(input);
    expect(attempt.getSnapshot().status).toBe("failed");
    expect(request).toHaveBeenCalledTimes(1);
    await attempt.submit(input);
    expect(attempt.getSnapshot().status).toBe("created");
  },
);
it.each([408, 500, 502, 503])(
  "does not assume rollback after HTTP %s",
  async (status) => {
    const { request, attempt } = fixture();
    request.mockRejectedValueOnce(new ApiError("http", status));
    await attempt.submit(input);
    expect(attempt.getSnapshot().status).toBe("unknown");
  },
);
it("treats an invalid success payload as an unknown outcome", async () => {
  const request = vi.fn(async () => ({}));
  const attempt = createAttempt(request as unknown as AuthenticatedRequest);
  await attempt.submit(input);
  expect(attempt.getSnapshot().status).toBe("unknown");
  expect(await attempt.submit(input)).toBe(false);
});
it("ignores a response after the authenticated provider is disposed", async () => {
  let resolve!: (value: typeof organization) => void;
  const request = vi.fn(
    () =>
      new Promise<typeof organization>((yes) => {
        resolve = yes;
      }),
  );
  const attempt = createAttempt(request as unknown as AuthenticatedRequest);
  const pending = attempt.submit(input);
  attempt.dispose();
  resolve(organization);
  expect(await pending).toBe(false);
  expect(attempt.getSnapshot().organization).toBeUndefined();
});

it("persists a per-user intention and replays it after reload without a new key", async () => {
  const { request } = fixture();
  request.mockRejectedValueOnce(new ApiError("network"));
  const userId = "00000000-0000-4000-8000-000000000099";
  const first = createAttempt(
    request as unknown as AuthenticatedRequest,
    userId,
  );
  await first.submit(input);
  const key = first.getSnapshot().intention?.key;
  expect(key).toBeTruthy();
  first.dispose();
  const second = createAttempt(
    request as unknown as AuthenticatedRequest,
    userId,
  );
  expect(second.getSnapshot().status).toBe("unknown");
  await second.recover();
  expect(second.getSnapshot().status).toBe("created");
  expect(second.getSnapshot().intention?.key).toBe(key);
  const anotherUser = createAttempt(
    request as unknown as AuthenticatedRequest,
    "00000000-0000-4000-8000-000000000098",
  );
  expect(anotherUser.getSnapshot().status).toBe("idle");
  second.complete();
  expect(localStorage.getItem("ronetz.onboarding." + userId)).toBeNull();
});
it.each(["IDEMPOTENCY_CONFLICT", "IDEMPOTENCY_KEY_EXPIRED"])(
  "does not recycle a key for %s",
  async (code) => {
    const { request, attempt } = fixture();
    request.mockRejectedValueOnce(
      new ApiError("http", 409, { title: "Conflict", status: 409, code }),
    );
    await attempt.submit(input);
    expect(attempt.getSnapshot().status).toBe("unknown");
    expect(await attempt.recover()).toBe(false);
    expect(await attempt.submit({ ...input, name: "Changed" })).toBe(false);
    expect(request).toHaveBeenCalledTimes(1);
  },
);
it("uses a new intention only after a confirmed rejection with changed content", async () => {
  const { request, attempt } = fixture();
  request.mockRejectedValueOnce(new ApiError("http", 400));
  await attempt.submit(input);
  const key = attempt.getSnapshot().intention?.key;
  await attempt.submit({ ...input, name: "Corrected" });
  expect(attempt.getSnapshot().intention?.key).not.toBe(key);
});
it("retains an unknown 401 outcome until explicitly replayed with refreshed credentials", async () => {
  const { request, attempt } = fixture();
  request.mockRejectedValueOnce(new ApiError("http", 401));
  await attempt.submit(input);
  expect(attempt.getSnapshot().status).toBe("unknown");
  await attempt.recover();
  expect(attempt.getSnapshot().status).toBe("created");
});
