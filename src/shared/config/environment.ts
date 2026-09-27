import { z } from "zod";
const environmentSchema = z
  .object({
    VITE_API_BASE_URL: z.url().refine((value) => {
      const url = new URL(value);
      return (
        ["http:", "https:"].includes(url.protocol) &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash
      );
    }, "Une URL HTTP(S) sans credentials, query ou fragment est requise."),
    VITE_APP_ENV: z.enum(["development", "test", "staging", "production"]),
    VITE_ENABLE_MOCKS: z
      .enum(["true", "false"])
      .transform((value) => value === "true"),
  })
  .refine(
    (value) =>
      !["staging", "production"].includes(value.VITE_APP_ENV) ||
      !value.VITE_ENABLE_MOCKS,
    "Mocks interdits en staging et production.",
  );
export function parseEnvironment(input: unknown) {
  const result = environmentSchema.safeParse(input);
  if (!result.success)
    throw new Error(
      "Configuration frontend invalide : vérifier les variables VITE_* documentées.",
    );
  return {
    apiBaseUrl: result.data.VITE_API_BASE_URL.replace(/\/+$/, ""),
    appEnv: result.data.VITE_APP_ENV,
    enableMocks: result.data.VITE_ENABLE_MOCKS,
  };
}
export const config = {
  ...parseEnvironment(import.meta.env),
  isDevelopment: import.meta.env.DEV,
};
