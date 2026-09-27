import { expect, it } from "vitest";
import {
  clearOrganizationCache,
  createQueryClient,
  retryQuery,
  tenantKeys,
} from "./query-client";
import { ApiError } from "@/shared/errors/api-error";
it("isolates tenant keys and removes the previous tenant cache", () => {
  const client = createQueryClient();
  const first = tenantKeys.resource("org-a", "sites", "list", {});
  const second = tenantKeys.resource("org-b", "sites", "list", {});
  client.setQueryData(first, ["site-a"]);
  client.setQueryData(second, ["site-b"]);
  expect(client.getQueryData(first)).toEqual(["site-a"]);
  clearOrganizationCache(client, "org-a");
  expect(client.getQueryData(first)).toBeUndefined();
  expect(client.getQueryData(second)).toEqual(["site-b"]);
  expect(client.getDefaultOptions().mutations?.retry).toBe(false);
  client.clear();
});
it("bounds retries to network, timeout and selected server failures", () => {
  for (const status of [400, 401, 403, 404, 409, 422, 429])
    expect(retryQuery(0, new ApiError("http", status))).toBe(false);
  expect(retryQuery(0, new ApiError("network"))).toBe(true);
  expect(retryQuery(1, new ApiError("http", 503))).toBe(true);
  expect(retryQuery(2, new ApiError("http", 503))).toBe(false);
  expect(retryQuery(0, new ApiError("aborted"))).toBe(false);
  expect(retryQuery(0, new Error())).toBe(false);
});
