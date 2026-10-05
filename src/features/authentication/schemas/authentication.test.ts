import { expect, it } from "vitest";
import { loginSchema, registerSchema, normalizeEmail } from "./authentication";
const valid = {
  firstName: "Test",
  lastName: "Fixture",
  email: "test@example.test",
  password: "Fixture-pass-123",
};
it("validates only the registration DTO", () => {
  expect(registerSchema.safeParse(valid).success).toBe(true);
  for (const patch of [
    { firstName: " " },
    { lastName: "x".repeat(101) },
    { email: "invalid" },
    { password: "short" },
    { password: "é".repeat(37) },
  ])
    expect(registerSchema.safeParse({ ...valid, ...patch }).success).toBe(
      false,
    );
  expect(
    registerSchema.safeParse({
      ...valid,
      password: "é".repeat(36),
    }).success,
  ).toBe(true);
});
it("does not impose registration password rules at login and normalizes contractual email", () => {
  expect(
    loginSchema.safeParse({ email: " Test@Example.test ", password: "x" })
      .success,
  ).toBe(true);
  expect(
    loginSchema.safeParse({ email: valid.email, password: "" }).success,
  ).toBe(false);
  expect(normalizeEmail(" Test@Example.test ")).toBe("test@example.test");
});
