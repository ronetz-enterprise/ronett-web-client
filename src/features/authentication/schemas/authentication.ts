import { z } from "zod";
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
const email = z
  .string()
  .refine(
    (value) =>
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(normalizeEmail(value)),
    "Saisissez une adresse email valide.",
  );
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Saisissez votre mot de passe."),
});
export const registerSchema = z
  .object({
    email,
    firstName: z
      .string()
      .refine((v) => !!v.trim(), "Saisissez votre prénom.")
      .max(100, "100 caractères maximum."),
    lastName: z
      .string()
      .refine((v) => !!v.trim(), "Saisissez votre nom.")
      .max(100, "100 caractères maximum."),
    password: z
      .string()
      .min(8, "8 caractères minimum.")
      .max(72, "72 caractères maximum.")
      .refine(
        (v) => new TextEncoder().encode(v).length <= 72,
        "Le mot de passe dépasse 72 octets UTF-8.",
      ),
    confirmation: z.string(),
  })
  .refine((v) => v.password === v.confirmation, {
    path: ["confirmation"],
    message: "Les mots de passe doivent être identiques.",
  });
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export const tokenSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal("Bearer"),
  expiresIn: z.number().int().positive().max(2147483),
});
export type Tokens = z.infer<typeof tokenSchema>;
