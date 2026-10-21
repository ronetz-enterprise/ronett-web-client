import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useHydrated } from "@/shared/hooks/use-hydrated";
import { ApiError } from "@/shared/errors/api-error";
import {
  claimCredential,
  createCheckout,
  initiatePayment,
  latestPayment,
  paymentChannels,
  publicSite,
  purchaseAccess,
  verifyPayment,
  type Payment,
  type PurchaseAccessStatus,
} from "../api/purchase-api";
import { toInternational, type PaymentFormValues } from "../model/mobile-money";
import { fallbackPaymentChannels, findChannel } from "../model/payment-channel";
import {
  createStageClock,
  pollInterval,
  purchaseStage,
} from "../model/purchase-progress";
import {
  readPurchaseSession,
  savePurchaseSession,
  updatePurchaseSession,
  type PurchaseSession,
} from "../model/purchase-session";

/**
 * Moyens de paiement proposés par l'application. Tant que la liste n'est pas arrivée, ou si elle ne
 * peut pas l'être, la liste de secours est affichée : le serveur reste juge au paiement.
 */
export function usePaymentChannels() {
  const query = useQuery({
    queryKey: ["payment-channels"],
    staleTime: 60_000,
    retry: 1,
    queryFn: ({ signal }) => paymentChannels(signal),
  });
  return query.data && query.data.length > 0
    ? query.data
    : fallbackPaymentChannels;
}

/** Nom et ville du lieu, pour l'en-tête du parcours ; rien si le lien ne correspond à aucun lieu. */
export function usePublicSite(siteId: string | undefined) {
  return useQuery({
    queryKey: ["public-site", siteId],
    enabled: !!siteId,
    staleTime: 5 * 60_000,
    retry: 1,
    queryFn: ({ signal }) => publicSite(siteId!, signal),
  });
}

/** Code opérateur gardé avec l'achat, pour l'affichage et les achats d'avant les canaux. */
function networkOf(channelId: string) {
  return findChannel(fallbackPaymentChannels, channelId)?.network ?? channelId;
}

/**
 * Lance un achat : crée l'achat (jeton gardé sur l'appareil), puis demande le paiement mobile
 * money. Si le paiement ne peut pas être lancé, l'achat existe quand même : la page de suivi
 * propose alors de réessayer, sans recréer d'achat.
 *
 * La clé d'idempotence du paiement est tirée une fois par envoi du formulaire : un double appui
 * ou une réponse perdue rejoue la même demande au lieu d'en créer une seconde.
 */
export function useStartPurchase(siteId: string, offerId: string) {
  return useMutation({
    retry: false,
    mutationFn: async (values: PaymentFormValues) => {
      const phoneNumber = toInternational(values.phone);
      const checkout = await createCheckout(siteId, {
        offerId,
        phoneNumber,
        email: values.email === "" ? null : values.email,
      });
      const session: PurchaseSession = {
        purchaseId: checkout.purchase.id,
        siteId,
        offerId,
        token: checkout.checkoutToken,
        payableUntil: checkout.expiresAt,
        channelId: values.channelId,
        network: networkOf(values.channelId),
        phone: values.phone,
        paymentId: null,
        createdAt: new Date().toISOString(),
      };
      const stored = savePurchaseSession(session);
      try {
        const payment = await initiatePayment(checkout.checkoutToken, {
          purchaseId: session.purchaseId,
          channelId: values.channelId,
          phoneNumber,
          idempotencyKey: crypto.randomUUID(),
        });
        updatePurchaseSession(session.purchaseId, { paymentId: payment.id });
      } catch {
        // Le suivi montrera « Le paiement n'a pas pu être lancé » avec un bouton pour réessayer.
      }
      return { purchaseId: session.purchaseId, stored };
    },
  });
}

/**
 * Le suivi suppose le jeton de cet appareil ; sans lui, l'achat ne peut pas être consulté.
 * La page est d'abord rendue par le serveur, où le stockage du navigateur n'existe pas : la
 * session n'est lue qu'une fois la page hydratée (`ready`), pour ne pas conclure à tort qu'elle
 * manque.
 */
export function usePurchaseSession(purchaseId: string) {
  const hydrated = useHydrated();
  const session = useMemo(
    () => (hydrated ? readPurchaseSession(purchaseId) : null),
    [hydrated, purchaseId],
  );
  return { session, ready: hydrated };
}

const keys = {
  payment: (purchaseId: string) => ["purchase", purchaseId, "payment"] as const,
  access: (purchaseId: string) => ["purchase", purchaseId, "access"] as const,
  credential: (grantId: string) => ["purchase", "credential", grantId] as const,
};

/**
 * Suit l'achat en interrogeant le paiement et l'achat, toutes les 4 s puis toutes les 10 s
 * après deux minutes dans la même étape ; s'arrête quand l'accès est prêt ou que l'achat ne peut
 * plus aboutir.
 */
export function usePurchaseProgress(session: PurchaseSession) {
  const client = useQueryClient();
  const [waitedIn] = useState(() => createStageClock());
  const payment = useQuery({
    queryKey: keys.payment(session.purchaseId),
    retry: (count, error) =>
      !(error instanceof ApiError && error.status === 404) && count < 2,
    queryFn: async ({ signal }) => {
      try {
        return await latestPayment(session.purchaseId, session.token, signal);
      } catch (error) {
        // Aucune tentative enregistrée : le paiement n'a pas pu être lancé.
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    refetchInterval: (query) => {
      const { kind } = purchaseStage({
        payment: query.state.data ?? null,
        access:
          client.getQueryData<PurchaseAccessStatus>(
            keys.access(session.purchaseId),
          ) ?? null,
        payableUntil: session.payableUntil,
      });
      return pollInterval(kind, waitedIn(kind));
    },
  });
  const access = useQuery({
    queryKey: keys.access(session.purchaseId),
    retry: 2,
    queryFn: ({ signal }) =>
      purchaseAccess(session.purchaseId, session.token, signal),
    refetchInterval: (query) => {
      const { kind } = purchaseStage({
        payment: payment.data ?? null,
        access: query.state.data ?? null,
        payableUntil: session.payableUntil,
      });
      return pollInterval(kind, waitedIn(kind));
    },
  });
  const stage = purchaseStage({
    payment: payment.data ?? null,
    access: access.data ?? null,
    payableUntil: session.payableUntil,
  });
  return {
    stage,
    payment: payment.data ?? null,
    access: access.data ?? null,
    loading: payment.isPending || access.isPending,
    error: payment.error ?? access.error,
    refetch: () => Promise.all([payment.refetch(), access.refetch()]),
  };
}

/** Nouvelle tentative de paiement sur le même achat (5 au plus, pendant 20 minutes). */
export function useRetryPayment(session: PurchaseSession) {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (
      values: Pick<PaymentFormValues, "channelId" | "phone">,
    ) => {
      const payment = await initiatePayment(session.token, {
        purchaseId: session.purchaseId,
        channelId: values.channelId,
        phoneNumber: toInternational(values.phone),
        idempotencyKey: crypto.randomUUID(),
      });
      updatePurchaseSession(session.purchaseId, {
        paymentId: payment.id,
        channelId: values.channelId,
        network: networkOf(values.channelId),
        phone: values.phone,
      });
      return payment;
    },
    onSuccess: (payment) =>
      client.setQueryData(keys.payment(session.purchaseId), payment),
  });
}

/**
 * « J'ai validé » : demande au serveur de vérifier tout de suite auprès de l'opérateur. Le serveur
 * accepte une vérification par minute ; au-delà il répond 429, ce qui n'est pas une erreur pour
 * l'acheteur (une vérification est déjà en cours).
 */
export function useVerifyPayment(session: PurchaseSession) {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (payment: Payment) => {
      try {
        return await verifyPayment(payment.id, session.token);
      } catch (error) {
        if (error instanceof ApiError && error.status === 429) return null;
        throw error;
      }
    },
    onSuccess: (payment) => {
      if (payment)
        client.setQueryData(keys.payment(session.purchaseId), payment);
      void client.invalidateQueries({
        queryKey: keys.access(session.purchaseId),
      });
    },
  });
}

/**
 * Récupère le mot de passe une fois l'accès prêt. Chaque appel compte comme une remise (5 au plus
 * en 15 minutes) : la demande n'est faite qu'une fois par page, le résultat reste en mémoire
 * (jamais dans le stockage du navigateur) et un nouveau rendu ne la répète pas. Sans remise
 * possible et sans identifiants déjà reçus, rien n'est demandé.
 */
export function useDeliveredCredential(
  session: PurchaseSession,
  accessGrantId: string,
  deliverable: boolean,
) {
  const client = useQueryClient();
  const known =
    client.getQueryData(keys.credential(accessGrantId)) !== undefined;
  return useQuery({
    queryKey: keys.credential(accessGrantId),
    enabled: deliverable || known,
    retry: (count, error) =>
      error instanceof ApiError &&
      (error.kind === "network" ||
        error.kind === "timeout" ||
        error.status === 503) &&
      count < 3,
    retryDelay: 5_000,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: () => claimCredential(accessGrantId, session.token),
  });
}
