import { expect, it } from "vitest";
import {
  ApiError,
  extractCorrelationId,
  extractFieldErrors,
  isProblemDetail,
  parseProblemDetail,
  toUserMessage,
} from "./api-error";
const problem = {
  title: "Validation",
  status: 400,
  errorCode: "INVALID",
  correlationId: "body-id",
  errors: [
    { field: "email", message: "required" },
    { field: "email", message: "invalid" },
    { field: "__proto__", message: "safe" },
  ],
};
it("parses the actual Spring contract and aggregates field errors safely", () => {
  expect(isProblemDetail(problem)).toBe(true);
  expect(parseProblemDetail(problem)?.errorCode).toBe("INVALID");
  expect(extractFieldErrors(problem).email).toEqual(["required", "invalid"]);
  expect(extractFieldErrors(problem).__proto__).toEqual(["safe"]);
  expect(isProblemDetail({ status: "400" })).toBe(false);
  expect(parseProblemDetail("<html>")).toBeUndefined();
});
it("keeps header correlation unchanged, then falls back to body", () => {
  expect(
    extractCorrelationId(
      new Headers({ "x-correlation-id": "header-id" }),
      problem,
    ),
  ).toBe("header-id");
  expect(extractCorrelationId(new Headers(), problem)).toBe("body-id");
});
it("never displays diagnostic detail, titles or arbitrary errors", () => {
  const error = new ApiError("http", 500, {
    status: 500,
    title: "sensitive",
    detail: "sensitive",
  });
  expect(toUserMessage(error)).not.toContain("sensitive");
  expect(toUserMessage(new Error("sensitive"))).not.toContain("sensitive");
});
