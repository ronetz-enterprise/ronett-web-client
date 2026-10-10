import { useEffect, useState } from "react";
import { useAuth } from "@/features/authentication";
import { ApiError } from "@/shared/errors/api-error";
import { accessEndpoints } from "../api/access-endpoints";
import {
  issuedCredentialSchema,
  type IssuedCredential,
} from "../model/manual-access";

/**
 * Intervalle entre deux demandes tant que le nœud n'a pas confirmé l'accès. Le backend
 * confirme en quelques secondes et n'accepte que 10 demandes par minute et par adresse :
 * 7 s laissent 9 demandes dans la première minute, première demande comprise.
 */
const POLL_INTERVAL_MS = 7_000;
/** Après un `429`, la fenêtre du backend est d'une minute : on attend sa fin. */
const RATE_LIMITED_WAIT_MS = 30_000;
/** Au-delà, l'accès reste visible dans la liste : seul l'affichage du mot de passe est perdu. */
const GIVE_UP_AFTER_MS = 5 * 60_000;

export type RemoteCredentialState =
  | { status: "waiting" }
  | { status: "ready"; credential: IssuedCredential }
  | { status: "expired" }
  | { status: "failed"; error: unknown };

/**
 * Remise du mot de passe d'un accès préparé par le nœud du site.
 *
 * Le backend répond `503` tant que le nœud n'a pas confirmé l'accès, et `429` au-delà de
 * sa limite de débit : ces réponses ne consomment aucune des 5 remises autorisées. Un `403`
 * signifie jeton expiré ou remises épuisées. Le jeton et le mot de passe ne vivent que dans
 * l'état de ce hook.
 */
export function useRemoteCredentialDelivery(
  accessGrantId: string,
  retrievalToken: string,
): RemoteCredentialState {
  const { request } = useAuth();
  const [state, setState] = useState<RemoteCredentialState>({
    status: "waiting",
  });
  useEffect(() => {
    const controller = new AbortController();
    const deadline = Date.now() + GIVE_UP_AFTER_MS;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function attempt() {
      try {
        const value = await request(
          accessEndpoints.credentialDelivery(accessGrantId),
          {
            method: "POST",
            body: { token: retrievalToken },
            signal: controller.signal,
          },
        );
        const credential = issuedCredentialSchema.safeParse(value);
        setState(
          credential.success
            ? { status: "ready", credential: credential.data }
            : { status: "failed", error: new ApiError("invalid-response") },
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        const rateLimited = error instanceof ApiError && error.status === 429;
        const pending =
          rateLimited ||
          (error instanceof ApiError &&
            (error.status === 503 ||
              error.kind === "network" ||
              error.kind === "timeout"));
        if (pending && Date.now() < deadline) {
          timer = setTimeout(
            () => void attempt(),
            rateLimited ? RATE_LIMITED_WAIT_MS : POLL_INTERVAL_MS,
          );
          return;
        }
        if (error instanceof ApiError && error.status === 403) {
          setState({ status: "expired" });
          return;
        }
        setState({ status: "failed", error });
      }
    }
    void attempt();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [accessGrantId, retrievalToken, request]);
  return state;
}
