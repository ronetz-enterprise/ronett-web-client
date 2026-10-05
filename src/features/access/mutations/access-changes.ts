import { useEffect, useRef } from "react";
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/features/authentication";
import type { Membership } from "@/features/memberships";
import { ApiError } from "@/shared/errors/api-error";
import {
  accessTransitions,
  type AccessTransition,
} from "../api/access-endpoints";
import { accessGrantSchema, type AccessGrant } from "../model/access-grant";
import { accessPermissions } from "../permissions/access-permissions";
import { accessKeys } from "../queries/access-grants";

export type AccessChange = {
  transition: AccessTransition;
  accessGrantId: string;
};

function readGrant(
  value: unknown,
  organizationId: string,
  accessGrantId: string,
) {
  const parsed = accessGrantSchema.safeParse(value);
  if (
    !parsed.success ||
    parsed.data.organizationId !== organizationId ||
    parsed.data.accessGrantId !== accessGrantId
  )
    // Une réponse incohérente avec le tenant attendu n'est jamais rendue.
    throw new ApiError("invalid-response");
  return parsed.data;
}

/**
 * Transitions métier du droit d'accès : suspension, reprise, révocation et
 * relance de projection.
 *
 * Aucune requête ne part sur un état optimiste : la réponse du backend fait
 * foi, et les dimensions métier et projection restent distinctes. L'état
 * courant est relu avant l'appel pour ne jamais agir à l'aveugle, le double
 * clic est bloqué par verrou local et par l'état de mutation partagé, et le
 * cache du tenant est invalidé après coup.
 *
 * Une intention restrictive peut être enregistrée même si la projection échoue :
 * le backend répond alors `503` en enregistrant l'intention tout en laissant la
 * projection en échec. L'interface affiche dans ce cas l'état réellement
 * retourné, jamais une réussite technique.
 */
export function useAccessChanges(active: Membership) {
  const { request } = useAuth();
  const client = useQueryClient();
  const mounted = useRef(true);
  const lock = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const mutationKey = accessKeys.mutation(active.organizationId);
  const busy = useIsMutating({ mutationKey }) > 0;
  const mutation = useMutation<AccessGrant, unknown, AccessChange>({
    mutationKey,
    retry: false,
    mutationFn: async ({ transition, accessGrantId }) => {
      if (!z.uuid().safeParse(accessGrantId).success)
        throw new ApiError("http", 404);
      const current = client.getQueryData<AccessGrant>(
        accessKeys.detail(active.organizationId, accessGrantId),
      );
      if (!current || current.organizationId !== active.organizationId)
        throw new ApiError("http", 403);
      const permissions = accessPermissions(active, current);
      const allowed: Record<AccessTransition, boolean> = {
        suspend: permissions.canSuspendAccess,
        resume: permissions.canResumeAccess,
        revoke: permissions.canRevokeAccess,
        retryProjection: permissions.canRetryProvisioning,
      };
      if (!allowed[transition]) throw new ApiError("http", 403);
      if (!mounted.current) throw new ApiError("aborted");
      const route = accessTransitions[transition](accessGrantId);
      // Corps vide : le contrat de transition n'accepte aucun motif.
      return readGrant(
        await request(route.path, { method: route.method }),
        active.organizationId,
        accessGrantId,
      );
    },
    onSuccess: (grant) => {
      if (!mounted.current) return;
      client.setQueryData(
        accessKeys.detail(active.organizationId, grant.accessGrantId),
        grant,
      );
    },
    onSettled: async () => {
      if (!mounted.current) return;
      // Seul le cache du module est invalidé : la lecture de membership reste
      // à la garde d'organisation, pour éviter le cycle de remontage décrit
      // dans `queries/access-grants.ts`.
      await client.invalidateQueries({
        queryKey: accessKeys.all(active.organizationId),
      });
    },
  });
  return {
    ...mutation,
    pending: busy || mutation.isPending,
    change: async (value: AccessChange) => {
      if (lock.current || client.isMutating({ mutationKey }))
        return { applied: false as const };
      lock.current = true;
      try {
        const grant = await mutation.mutateAsync(value);
        return { applied: mounted.current, grant };
      } finally {
        lock.current = false;
      }
    },
  };
}
