import { z } from "zod";
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .max(150, "150 caractères maximum.")
    .refine((value) => !!value.trim(), "Saisissez le nom de l’organisation."),
  currency: z
    .string()
    .refine(
      (value) => /^[a-z]{3}$/i.test(value.trim()),
      "Saisissez un code devise à trois lettres, par exemple XAF.",
    ),
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export function toCreateOrganizationDto(input: CreateOrganizationInput) {
  return {
    name: input.name.trim(),
    currency: input.currency.trim().toUpperCase(),
  };
}
