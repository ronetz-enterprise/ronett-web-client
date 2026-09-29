import { http, HttpResponse } from "msw";
import { config } from "@/shared/config/environment";
import {
  fixtureEmail,
  fixtureRecord,
  saveFixture,
  membership,
} from "./tenant-fixtures";
function problem(
  status: number,
  code: string,
  errors?: { field: string; message: string }[],
) {
  return HttpResponse.json(
    {
      title: "Creation failed",
      type: "https://api.ronetz.com/problems/creation",
      status,
      code,
      correlationId: "onboarding-fixture-correlation",
      ...(errors ? { errors } : {}),
    },
    { status },
  );
}
export const onboardingHandlers = [
  http.post(config.apiBaseUrl + "/api/organizations", async ({ request }) => {
    const email = fixtureEmail(request);
    if (!email) return problem(401, "AUTHENTICATION_REQUIRED");
    const body = (await request.json()) as { name: string; currency: string };
    const key = request.headers.get("Idempotency-Key");
    if (!key || !/^[0-9a-f-]{36}$/i.test(key))
      return problem(400, "INVALID_KEY");
    const record = fixtureRecord(email);
    const existing = record.operations[key];
    if (
      existing &&
      (existing.name !== body.name || existing.currency !== body.currency)
    )
      return problem(409, "IDEMPOTENCY_CONFLICT");
    if (body.name === "Fixture expired")
      return problem(409, "IDEMPOTENCY_KEY_EXPIRED");
    if (body.name === "Fixture validation")
      return problem(400, "VALIDATION_FAILED", [
        { field: "name", message: "Invalid name" },
      ]);
    if (
      !body.name?.trim() ||
      body.name.length > 150 ||
      !["XAF", "EUR", "USD"].includes(body.currency) ||
      Object.keys(body).some((k) => !["name", "currency"].includes(k))
    )
      return problem(400, "INVALID_ORGANIZATION_DATA");
    if (body.name === "Fixture server") return problem(500, "INTERNAL_ERROR");
    if (body.name === "Fixture network") return HttpResponse.error();
    const operation = existing ?? {
      name: body.name,
      currency: body.currency,
      id: crypto.randomUUID(),
    };
    if (!existing) {
      record.operations[key] = operation;
      record.items.push(membership(operation.id, operation.name));
      saveFixture(email);
      if (body.name === "Fixture lost") return HttpResponse.error();
    }
    return HttpResponse.json(
      {
        id: operation.id,
        name: operation.name,
        currency: operation.currency,
        status: "ACTIVE",
        suspensionReason: null,
        suspendedAt: null,
        closedAt: null,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        status: 201,
        headers: { Location: "/api/organizations/" + operation.id },
      },
    );
  }),
];
