import { http, HttpResponse } from "msw";
import { config } from "@/shared/config/environment";
import { fixtureEmail, fixtureRecord, saveFixture } from "./tenant-fixtures";
type FixtureMember = {
  id: string;
  userId: string;
  organizationId: string;
  role: "OWNER";
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
  createdAt: string;
  updatedAt: string;
};
const members = new Map<string, FixtureMember[]>();
export function resetMemberFixtures() {
  members.clear();
}
export const fixtureCurrentUser = "00000000-0000-4000-8000-000000000099";
export const fixtureOtherUser = "00000000-0000-4000-8000-000000000077";
function problem(status: number, code: string) {
  return HttpResponse.json(
    {
      type:
        "https://api.ronetz.com/problems/" +
        code.toLowerCase().replaceAll("_", "-"),
      title: "Request rejected",
      status,
      code,
      correlationId: "membership-fixture-correlation",
    },
    { status },
  );
}
function context(request: Request, id: string, permission: string) {
  const email = fixtureEmail(request);
  if (!email) return { response: problem(401, "AUTHENTICATION_REQUIRED") };
  const record = fixtureRecord(email);
  const item = record.items.find((m) => m.organizationId === id);
  if (!item) return { response: problem(403, "ORGANIZATION_ACCESS_DENIED") };
  if (item.membershipStatus !== "ACTIVE")
    return { response: problem(403, "MEMBERSHIP_" + item.membershipStatus) };
  if (item.organizationStatus !== "ACTIVE")
    return {
      response: problem(403, "ORGANIZATION_" + item.organizationStatus),
    };
  if (!item.permissions.includes(permission))
    return { response: problem(403, "ACCESS_DENIED") };
  return { email, record, item };
}
function make(userId: string, id: string): FixtureMember {
  return {
    id: crypto.randomUUID(),
    userId,
    organizationId: id,
    role: "OWNER",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}
export function fixtureMembers(email: string, id: string) {
  const key = email + id;
  if (!members.has(key)) {
    let stored: FixtureMember[] | undefined;
    if (typeof sessionStorage !== "undefined") {
      const raw = sessionStorage.getItem("msw-members." + key);
      if (raw) stored = JSON.parse(raw) as FixtureMember[];
    }
    members.set(
      key,
      stored ??
        (email.startsWith("empty-members")
          ? []
          : email.startsWith("last-owner")
            ? [make(fixtureCurrentUser, id)]
            : [make(fixtureCurrentUser, id), make(fixtureOtherUser, id)]),
    );
  }
  return members.get(key)!;
}
function save(email: string, id: string) {
  if (typeof sessionStorage !== "undefined")
    sessionStorage.setItem(
      "msw-members." + email + id,
      JSON.stringify(fixtureMembers(email, id)),
    );
}
const base = config.apiBaseUrl + "/api/organizations/:id";
export const memberHandlers = [
  http.get(base, ({ request, params }) => {
    const ctx = context(request, String(params.id), "ORGANIZATION_READ");
    if ("response" in ctx) return ctx.response;
    return HttpResponse.json({
      id: params.id,
      name: ctx.item.organizationName,
      currency: "XAF",
      status: ctx.item.organizationStatus,
      suspensionReason: null,
      suspendedAt: null,
      closedAt: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    });
  }),
  http.get(base + "/memberships", ({ request, params }) => {
    const ctx = context(request, String(params.id), "MEMBERSHIP_READ");
    if ("response" in ctx) return ctx.response;
    if (ctx.email.startsWith("members-error"))
      return problem(503, "SERVICE_UNAVAILABLE");
    return HttpResponse.json(fixtureMembers(ctx.email, String(params.id)));
  }),
  http.post(base + "/memberships", async ({ request, params }) => {
    const ctx = context(request, String(params.id), "MEMBERSHIP_MANAGE");
    if ("response" in ctx) return ctx.response;
    const body = (await request.json()) as { userId: string; role: string };
    if (!/^[0-9a-f-]{36}$/i.test(body.userId) || body.role !== "OWNER")
      return problem(400, "INVALID_MEMBERSHIP_DATA");
    const list = fixtureMembers(ctx.email, String(params.id));
    if (list.some((m) => m.userId === body.userId))
      return problem(400, "INVALID_MEMBERSHIP_DATA");
    const member = make(body.userId, String(params.id));
    list.push(member);
    save(ctx.email, String(params.id));
    return HttpResponse.json(member, {
      status: 201,
      headers: {
        Location:
          "/api/organizations/" + params.id + "/memberships/" + body.userId,
      },
    });
  }),
  ...(["suspension", "reactivation", "revoke"] as const).map((action) => {
    const handler = ({
      request,
      params,
    }: {
      request: Request;
      params: Record<string, string | readonly string[] | undefined>;
    }) => {
      const ctx = context(request, String(params.id), "MEMBERSHIP_MANAGE");
      if ("response" in ctx) return ctx.response;
      const list = fixtureMembers(ctx.email, String(params.id));
      const target = list.find((m) => m.userId === params.userId);
      if (!target) return problem(404, "MEMBERSHIP_NOT_FOUND");
      if (target.status === "REVOKED")
        return action === "revoke"
          ? new HttpResponse(null, { status: 204 })
          : problem(400, "INVALID_MEMBERSHIP_DATA");
      if (
        action === "revoke" &&
        list.filter((m) => m.status === "ACTIVE").length <= 1
      )
        return problem(400, "INVALID_MEMBERSHIP_DATA");
      target.status =
        action === "suspension"
          ? "SUSPENDED"
          : action === "reactivation"
            ? "ACTIVE"
            : "REVOKED";
      target.updatedAt = "2026-09-28T00:00:00Z";
      if (target.userId === fixtureCurrentUser) {
        ctx.item.membershipStatus = target.status;
        ctx.item.permissions =
          target.status === "ACTIVE"
            ? [
                "ORGANIZATION_READ",
                "ORGANIZATION_UPDATE",
                "MEMBERSHIP_READ",
                "MEMBERSHIP_MANAGE",
              ]
            : [];
        saveFixture(ctx.email);
      }
      save(ctx.email, String(params.id));
      return new HttpResponse(null, { status: 204 });
    };
    return action === "revoke"
      ? http.delete(base + "/memberships/:userId", handler)
      : http.patch(base + "/memberships/:userId/" + action, handler);
  }),
];
