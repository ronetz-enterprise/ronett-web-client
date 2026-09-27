import { delay, http, HttpResponse } from "msw";
export const mockCorrelationId = "sprint-1-correlation";
export const handlers = [
  http.get("*/__mocks/success", () => HttpResponse.json({ ok: true })),
  http.get("*/__mocks/empty", () => new HttpResponse(null, { status: 204 })),
  http.get("*/__mocks/text", () => HttpResponse.text("résultat technique")),
  http.get("*/__mocks/validation", () =>
    HttpResponse.json(
      {
        title: "Validation failed",
        status: 400,
        correlationId: mockCorrelationId,
        errors: [{ field: "label", message: "must not be blank" }],
      },
      {
        status: 400,
        headers: {
          "Content-Type": "application/problem+json",
          "X-Correlation-Id": mockCorrelationId,
        },
      },
    ),
  ),
  ...[401, 403, 404, 409, 422, 429, 500, 502, 503].map((status) =>
    http.get(`*/__mocks/${status}`, () =>
      HttpResponse.json(
        {
          title: "Request failed",
          status,
          detail: "diagnostic technique à ne pas afficher",
          correlationId: mockCorrelationId,
        },
        {
          status,
          headers: {
            "Content-Type": "application/problem+json",
            "X-Correlation-Id": mockCorrelationId,
          },
        },
      ),
    ),
  ),
  http.get("*/__mocks/timeout", async () => {
    await delay(200);
    return HttpResponse.json({ ok: true });
  }),
  http.get("*/__mocks/network", () => HttpResponse.error()),
];
