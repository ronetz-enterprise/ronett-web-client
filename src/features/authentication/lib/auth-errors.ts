import { ApiError, toUserMessage } from "@/shared/errors/api-error";
export function authErrorMessage(
  error: unknown,
  operation: "login" | "register",
) {
  if (error instanceof ApiError) {
    if (
      operation === "login" &&
      (error.status === 401 ||
        error.problem?.type ===
          "https://api.ronetz.com/problems/account-inactive")
    )
      return "Connexion impossible avec ces identifiants.";
    if (operation === "register" && error.status === 409)
      return "Inscription impossible avec ces informations. Vous pouvez essayer de vous connecter.";
  }
  return toUserMessage(error);
}
