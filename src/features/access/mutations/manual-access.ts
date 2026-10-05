import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/authentication";
import type { Membership } from "@/features/memberships";
import { siteKeys } from "@/features/site";
import { ApiError } from "@/shared/errors/api-error";
import { accessEndpoints } from "../api/access-endpoints";
import { accessGrantSchema, type AccessGrant } from "../model/access-grant";
import {
  accessIssuanceResultSchema,
  manualAccessBody,
  manualAccessSchema,
  type AccessIssuanceResult,
  type ManualAccessValues,
} from "../model/manual-access";
import { accessPermissions } from "../permissions/access-permissions";
import { accessKeys } from "../queries/access-grants";

/**
 * Clé d'idempotence de la tentative courante.
 *
 * Elle est créée par le navigateur, comme pour la provisioning des routeurs, et
 * reste stable tant que la tentative est en cours : c'est le backend qui dédoublonne.
 */
function newIdempotencyKey() {
  return crypto.randomUUID();
}

/** Résultat utile au composant : le droit créé et, une seule fois, le secret. */
export type ManualAccessOutcome = AccessIssuanceResult & {
  grant: AccessGrant;
};

/**
 * Émission manuelle d'un droit d'accès.
 *
 * La clé `Idempotency-Key` est générée une fois par tentative et conservée tant
 * que le formulaire vit : c'est la seule garantie qu'un rejeu ne crée pas un
 * second droit. Un rejeu de la même clé renvoie le droit existant avec
 * `created=false` et **sans** mot de passe.
 *
 * La réponse est traitée comme sensible : elle n'alimente aucune query, aucun
 * store et aucun stockage persistant. Seul l'objet `credentialDelivery` est
 * conservé en état de composant pour l'affichage unique, et le jeton de
 * récupération présent dans la réponse n'est jamais lu.
 */
export function useManualAccess(active: Membership) {
  const { request } = useAuth();
  const client = useQueryClient();
  const mounted = useRef(true);
  const lock = useRef(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    newIdempotencyKey(),
  );
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const mutation = useMutation<
    ManualAccessOutcome,
    unknown,
    ManualAccessValues
  >({
    retry: false,
    mutationFn: async (values) => {
      if (!accessPermissions(active).canCreateManualAccess)
        throw new ApiError("http", 403);
      const parsed = manualAccessSchema.safeParse(values);
      if (!parsed.success) throw new ApiError("http", 400);
      // Le site est relu dans le cache des sites de l'organisation : sa
      // véritable appartenance est vérifiée par le backend, jamais déduite du
      // formulaire.
      const sites = client.getQueryData<
        { id: string; organizationId: string; status: string }[]
      >(siteKeys.list(active.organizationId));
      const site = sites?.find(
        (candidate) => candidate.id === parsed.data.siteId,
      );
      if (!site || site.organizationId !== active.organizationId)
        throw new ApiError("http", 404);
      if (site.status !== "ACTIVE") throw new ApiError("http", 409);
      if (!mounted.current) throw new ApiError("aborted");
      const value = await request(
        accessEndpoints.manualGrant(active.organizationId, site.id),
        {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey },
          body: manualAccessBody(parsed.data),
        },
      );
      const grant = accessGrantSchema.safeParse(
        (value as { grant?: unknown } | null)?.grant,
      );
      const result = accessIssuanceResultSchema.safeParse(value);
      if (
        !grant.success ||
        !result.success ||
        grant.data.organizationId !== active.organizationId ||
        grant.data.siteId !== site.id
      )
        throw new ApiError("invalid-response");
      return { ...result.data, grant: grant.data };
    },
    onSuccess: async (outcome) => {
      if (!mounted.current) return;
      client.setQueryData(
        accessKeys.detail(active.organizationId, outcome.grant.accessGrantId),
        outcome.grant,
      );
      await client.invalidateQueries({
        queryKey: accessKeys.all(active.organizationId),
      });
    },
  });
  return {
    ...mutation,
    pending: mutation.isPending,
    idempotencyKey,
    /** Nouveau couple (clé, formulaire) après une émission acceptée. */
    rotate: () => setIdempotencyKey(newIdempotencyKey()),
    issue: async (values: ManualAccessValues) => {
      if (lock.current || mutation.isPending)
        return { applied: false as const };
      lock.current = true;
      try {
        const result = await mutation.mutateAsync(values);
        return { applied: mounted.current, result };
      } finally {
        lock.current = false;
      }
    },
  };
}
