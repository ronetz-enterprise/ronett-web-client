import { z } from "zod";
import { httpClient } from "@/shared/api/http-client";
import { ApiError } from "@/shared/errors/api-error";

/**
 * Routes publiques de l'achat, appelées depuis l'appareil de l'acheteur, sans compte ni cookie.
 *
 * - `POST /api/public/sites/{site}/checkout` crée l'achat et renvoie le jeton d'achat.
 * - `POST /api/payments` (en-tête `X-Checkout-Token`) lance le paiement mobile money ; le montant
 *   et la devise viennent de l'achat, jamais du navigateur.
 * - `GET /api/purchases/{id}/payment` et `POST /api/payments/{id}/verify` suivent le paiement.
 * - `POST /api/public/purchases/{id}/access` suit l'achat jusqu'à l'accès prêt.
 * - `POST /api/public/access-grants/{id}/credential-delivery` remet le mot de passe (5 fois au
 *   plus, pendant 15 minutes).
 *
 * Les jetons voyagent dans un en-tête ou dans le corps, jamais dans l'URL.
 */
const uuid = z.uuid();
const instant = z.iso.datetime({ offset: true });
const amount = z.union([z.number(), z.string()]).transform(String);

const checkoutSchema = z.object({
  purchase: z.object({
    id: uuid,
    status: z.string(),
    amount,
    currency: z.string(),
  }),
  checkoutToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  expiresAt: instant,
});
export type Checkout = z.infer<typeof checkoutSchema>;

export const paymentStatuses = [
  "CREATED",
  "INITIATION_PENDING",
  "ACTION_REQUIRED",
  "PENDING",
  "VERIFICATION_PENDING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
  "UNKNOWN",
] as const;

const paymentSchema = z.object({
  id: uuid,
  purchaseId: uuid,
  amount,
  currency: z.string(),
  status: z.enum(paymentStatuses),
  actionType: z.string().nullable(),
  // Le serveur n'expose qu'une adresse de validation autorisée ; on exige en plus HTTPS.
  actionUrl: z
    .string()
    .nullable()
    .transform((value) => (value && /^https:\/\//.test(value) ? value : null)),
  createdAt: instant,
  confirmedAt: instant.nullable(),
});
export type Payment = z.infer<typeof paymentSchema>;

const accessStatusSchema = z.object({
  purchaseId: uuid,
  purchaseStatus: z.string(),
  accessGrantId: uuid.nullable(),
  accessStatus: z.string().nullable(),
  expiresAt: instant.nullable(),
  credentialReady: z.boolean(),
});
export type PurchaseAccessStatus = z.infer<typeof accessStatusSchema>;

const credentialSchema = z.object({
  credentialId: uuid,
  username: z.string().regex(/^rz_[a-f0-9]{32}$/),
  clearTextPassword: z.string().min(1),
  expiresAt: instant,
});
export type DeliveredCredential = z.infer<typeof credentialSchema>;

function parse<T>(schema: z.ZodType<T>, value: unknown) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new ApiError("invalid-response");
  return parsed.data;
}

function id(value: string) {
  if (!uuid.safeParse(value).success) throw new ApiError("http", 404);
  return value;
}

export async function createCheckout(
  siteId: string,
  body: { offerId: string; phoneNumber: string; email: string | null },
) {
  return parse(
    checkoutSchema,
    await httpClient(`/api/public/sites/${id(siteId)}/checkout`, {
      method: "POST",
      credentials: "omit",
      body: {
        offerId: id(body.offerId),
        phoneNumber: body.phoneNumber,
        email: body.email,
      },
    }),
  );
}

export async function initiatePayment(
  token: string,
  body: {
    purchaseId: string;
    network: string;
    phoneNumber: string;
    idempotencyKey: string;
  },
) {
  return parse(
    paymentSchema,
    await httpClient("/api/payments", {
      method: "POST",
      credentials: "omit",
      headers: { "X-Checkout-Token": token },
      body: {
        ...body,
        purchaseId: id(body.purchaseId),
        paymentMethod: "MOBILE_MONEY",
      },
    }),
  );
}

export async function latestPayment(
  purchaseId: string,
  token: string,
  signal?: AbortSignal,
) {
  return parse(
    paymentSchema,
    await httpClient(`/api/purchases/${id(purchaseId)}/payment`, {
      credentials: "omit",
      headers: { "X-Checkout-Token": token },
      signal,
    }),
  );
}

export async function verifyPayment(paymentId: string, token: string) {
  return parse(
    paymentSchema,
    await httpClient(`/api/payments/${id(paymentId)}/verify`, {
      method: "POST",
      credentials: "omit",
      headers: { "X-Checkout-Token": token },
    }),
  );
}

export async function purchaseAccess(
  purchaseId: string,
  token: string,
  signal?: AbortSignal,
) {
  return parse(
    accessStatusSchema,
    await httpClient(`/api/public/purchases/${id(purchaseId)}/access`, {
      method: "POST",
      credentials: "omit",
      body: { token },
      signal,
    }),
  );
}

export async function claimCredential(accessGrantId: string, token: string) {
  return parse(
    credentialSchema,
    await httpClient(
      `/api/public/access-grants/${id(accessGrantId)}/credential-delivery`,
      {
        method: "POST",
        credentials: "omit",
        body: { token },
      },
    ),
  );
}
