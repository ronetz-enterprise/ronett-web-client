import { describe, expect, it } from "vitest";
import { parseEnvironment } from "./environment";
const valid = {
  VITE_API_BASE_URL: "https://api.example.test/",
  VITE_APP_ENV: "test",
  VITE_ENABLE_MOCKS: "false",
};
describe("environment", () => {
  it("validates and normalizes public configuration", () => {
    expect(parseEnvironment(valid)).toEqual({
      apiBaseUrl: "https://api.example.test",
      appEnv: "test",
      enableMocks: false,
    });
  });
  it.each([
    {},
    { ...valid, VITE_ENABLE_MOCKS: "yes" },
    { ...valid, VITE_API_BASE_URL: "javascript:alert(1)" },
    { ...valid, VITE_API_BASE_URL: "https://user:password@example.test" },
    { ...valid, VITE_APP_ENV: "production", VITE_ENABLE_MOCKS: "true" },
  ])("rejects invalid configuration without echoing input", (input) => {
    expect(() => parseEnvironment(input)).toThrow(
      "Configuration frontend invalide",
    );
  });
});
