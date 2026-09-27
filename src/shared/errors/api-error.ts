import { z } from "zod";
const problemSchema = z.object({
  type: z.string().optional(),
  title: z.string(),
  status: z.number().int().min(400).max(599),
  detail: z.string().optional(),
  instance: z.string().optional(),
  errorCode: z.string().optional(),
  correlationId: z.string().optional(),
  errors: z
    .array(z.object({ field: z.string(), message: z.string() }))
    .optional(),
});
export type ApiProblem = z.infer<typeof problemSchema>;
export type ApiErrorKind =
  "http" | "network" | "timeout" | "aborted" | "invalid-response";
export function isProblemDetail(value: unknown): value is ApiProblem {
  return problemSchema.safeParse(value).success;
}
export function parseProblemDetail(value: unknown): ApiProblem | undefined {
  const result = problemSchema.safeParse(value);
  return result.success ? result.data : undefined;
}
export function extractFieldErrors(
  problem?: ApiProblem,
): Record<string, string[]> {
  const fields: Record<string, string[]> = Object.create(null);
  for (const error of problem?.errors ?? [])
    (fields[error.field] ??= []).push(error.message);
  return fields;
}
export function extractCorrelationId(headers: Headers, problem?: ApiProblem) {
  return headers.get("X-Correlation-Id") ?? problem?.correlationId;
}
export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    public readonly status = 0,
    public readonly problem?: ApiProblem,
    public readonly correlationId?: string,
  ) {
    super("La requête n’a pas abouti.");
    this.name = "ApiError";
  }
}
export function toUserMessage(error: unknown): string {
  if (!(error instanceof ApiError))
    return "Une erreur inattendue est survenue. Veuillez réessayer.";
  if (error.kind === "network")
    return "Connexion impossible. Vérifiez votre connexion Internet.";
  if (error.kind === "timeout")
    return "Le serveur met trop de temps à répondre.";
  if (error.kind === "aborted") return "La demande a été annulée.";
  const messages: Record<number, string> = {
    400: "Vérifiez les informations saisies.",
    401: "Votre session est absente ou expirée.",
    403: "Vous n’avez pas accès à cette ressource.",
    404: "Cette ressource est introuvable.",
    409: "Cette opération entre en conflit avec l’état actuel de la ressource.",
    422: "Les informations ne permettent pas cette opération.",
    429: "Trop de demandes. Veuillez patienter avant de réessayer.",
  };
  return (
    messages[error.status] ??
    "Le service est temporairement indisponible. Veuillez réessayer plus tard."
  );
}
