import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/features/authentication";
import type { Membership } from "@/features/memberships";
import { tenantKeys } from "@/shared/api/query-client";
import { ApiError } from "@/shared/errors/api-error";
import { accessEndpoints } from "../api/access-endpoints";
import { accessPermissions } from "../permissions/access-permissions";
import {
  accessGrantPageSchema,
  accessGrantSchema,
  isAppliedProjection,
  isFailedProjection,
  isTerminalGrant,
  type AccessGrant,
} from "../model/access-grant";

export const accessKeys = {
  // Namespace propre : `tenantKeys.resource(org, "access")` appartient déjà à
  // `membershipKeys.access`, utilisé par la garde d'organisation. Réutiliser ce
  // préfixe ferait.remonter l organization's guard à chaque mutation et
  // détruirait l'état local des pages.
  all: (organizationId: string) =>
    tenantKeys.resource(organizationId, "access-grants"),
  list: (
    organizationId: string,
    page: number,
    size: number,
    siteId: string | null = null,
  ) =>
    tenantKeys.resource(organizationId, "access", "list", {
      page,
      size,
      siteId,
    }),
  detail: (organizationId: string, accessGrantId: string) =>
    tenantKeys.resource(organizationId, "access", "detail", accessGrantId),
  // Clé de suivi distincte : jamais de secret, seulement l'identifiant du droit.
  tracking: (organizationId: string, accessGrantId: string) =>
    tenantKeys.resource(organizationId, "access", "tracking", accessGrantId),
  mutation: (organizationId: string) =>
    tenantKeys.resource(organizationId, "access-grant-mutation"),
};

const PAGE_SIZE = 20;

function parseGrant(
  value: unknown,
  organizationId: string,
  accessGrantId?: string,
) {
  const parsed = accessGrantSchema.safeParse(value);
  if (
    !parsed.success ||
    parsed.data.organizationId !== organizationId ||
    (accessGrantId && parsed.data.accessGrantId !== accessGrantId)
  )
    // Un droit d'une autre organisation ou un identifiant incohérent ne doit
    // jamais être rendu : la réponse est rejetée, pas filtrée côté affichage.
    throw new ApiError(
      accessGrantId ? "http" : "invalid-response",
      accessGrantId ? 404 : undefined,
    );
  return parsed.data;
}

/*
 * Échec d'une lecture : l'erreur est propagée telle quelle, sans invalidation
 * croisée.
 *
 * Invalider la membership sur un 403 serait un contre-sens : le refus porte sur
 * la ressource demandée, pas sur la session. surtout, la garde d'organisation
 * remplace tout le contenu par un écran de chargement pendant une lecture de
 * membership, ce qui démonte la page et remonte la requête : les deux
 * requêtes s'alimentent alors en boucle (403 -> membership -> démontage ->
 * 403). La membership reste rafraîchie par la garde elle-même (montage, focus,
 * erreur de session).
 */
const reportAccessFailure = () => {};

/**
 * Liste des droits d'accès.
 *
 * Le backend n'expose que `page` et `size`. Le seul filtre réellement supporté
 * est le périmètre de site, via l'endpoint scopé
 * `GET /api/organizations/{organizationId}/sites/{siteId}/access-grants` : il est
 * transmis en requête, tous les autres critères sont appliqués à la page
 * affichée et annoncés comme tels.
 */
export function useAccessGrantList(
  active: Membership,
  page: number,
  size = PAGE_SIZE,
  siteId: string | null = null,
) {
  const { request } = useAuth();
  return useQuery({
    queryKey: accessKeys.list(active.organizationId, page, size, siteId),
    enabled: accessPermissions(active).canViewAccessGrants,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      try {
        const result = accessGrantPageSchema.safeParse(
          await request(
            siteId
              ? accessEndpoints.siteList(active.organizationId, siteId)
              : accessEndpoints.organizationList(active.organizationId),
            {
              signal,
              // La pagination passe par `query` : le client authentifié refuse
              // un chemin contenant « ? ».
              query: { page: String(page), size: String(size) },
            },
          ),
        );
        if (
          !result.success ||
          result.data.page !== page ||
          result.data.size !== size ||
          result.data.content.length > size ||
          result.data.content.some(
            (grant) =>
              grant.organizationId !== active.organizationId ||
              (siteId !== null && grant.siteId !== siteId),
          ) ||
          new Set(result.data.content.map((grant) => grant.accessGrantId))
            .size !== result.data.content.length
        )
          throw new ApiError("invalid-response");
        return result.data;
      } catch (error) {
        reportAccessFailure();
        throw error;
      }
    },
  });
}

export function useAccessGrant(active: Membership, accessGrantId: string) {
  const { request } = useAuth();
  return useQuery({
    queryKey: accessKeys.detail(active.organizationId, accessGrantId),
    enabled: accessPermissions(active).canViewAccessDetails,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      if (!z.uuid().safeParse(accessGrantId).success)
        throw new ApiError("http", 404);
      try {
        return parseGrant(
          await request(accessEndpoints.detail(accessGrantId), { signal }),
          active.organizationId,
          accessGrantId,
        );
      } catch (error) {
        reportAccessFailure();
        throw error;
      }
    },
  });
}

/** Un état suivi n'a de sens que tant que la projection n'est pas terminée. */
function isTracking(grant: AccessGrant) {
  if (isTerminalGrant(grant)) return false;
  if (isAppliedProjection(grant.projectionStatus)) return false;
  if (isFailedProjection(grant.projectionStatus)) return false;
  return grant.status === "PENDING_PROVISIONING";
}

/**
 * Suivi de la projection technique.
 *
 * Politique d'observation, pas de délai serveur : 5 s, puis 15 s après une
 * erreur, plafond de 5 minutes, aucun rafraîchissement en arrière-plan. La
 * requête est une lecture non sensible (`GET /api/access-grants/{id}`) et
 * s'arrête sur un état terminal ; elle s'interrompt au démontage.
 */
export function useAccessGrantTracking(active: Membership, grant: AccessGrant) {
  const { request } = useAuth();
  const client = useQueryClient();
  const [deadline, setDeadline] = useState(() => Date.now() + 300_000);
  const [enabled, setEnabled] = useState(true);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const query = useQuery<AccessGrant>({
    queryKey: accessKeys.tracking(active.organizationId, grant.accessGrantId),
    enabled: enabled && accessPermissions(active, grant).canViewAccessDetails,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    refetchInterval: (query) => {
      const current = query.state.data ?? grant;
      if (!isTracking(current)) return false;
      if (Date.now() >= deadline) return false;
      if (
        query.state.error instanceof ApiError &&
        [401, 403, 404].includes(query.state.error.status)
      )
        return false;
      return query.state.error ? 15_000 : 5_000;
    },
    queryFn: async ({ signal }) => {
      const next = parseGrant(
        await request(accessEndpoints.detail(grant.accessGrantId), { signal }),
        active.organizationId,
        grant.accessGrantId,
      );
      if (!signal.aborted)
        client.setQueryData(
          accessKeys.detail(active.organizationId, grant.accessGrantId),
          next,
        );
      return next;
    },
  });
  return {
    ...query,
    grant: query.data ?? grant,
    tracking: enabled && Date.now() < deadline && isTracking(grant),
    pause: () => setEnabled(false),
    refresh: () => {
      setDeadline(Date.now() + 300_000);
      setEnabled(true);
      if (!query.isFetching) void query.refetch();
    },
  };
}
