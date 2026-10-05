import { useEffect, useRef } from "react";
import {
  useQueries,
  useQuery,
  useMutation,
  useQueryClient,
  useIsMutating,
} from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/features/authentication";
import { membershipKeys, type Membership } from "@/features/memberships";
import { readOrganization } from "@/features/organizations";
import { readSite } from "@/features/site";
import type { httpClient } from "@/shared/api/http-client";
import { tenantKeys } from "@/shared/api/query-client";
import { ApiError } from "@/shared/errors/api-error";
import { offerJsonCodec, ExactNumber } from "../api/exact-json";
import {
  offerSchema,
  offerPageSchema,
  offerCapabilities,
  createSchema,
  detailsSchema,
  priceSchema,
  policySchema,
  orderSchema,
  type Offer,
  type CreateValues,
  type EditKind,
  type OfferAction,
} from "../model/offer";
export const offerKeys = {
  site: (org: string, site: string) => tenantKeys.resource(org, "offers", site),
  list: (org: string, site: string, page: number, size: number) =>
    tenantKeys.resource(org, "offers", site, "list", { page, size }),
  detail: (org: string, site: string, id: string) =>
    tenantKeys.resource(org, "offers", site, "detail", id),
  mutation: (org: string) => tenantKeys.resource(org, "offer-mutation"),
};
function uuid(value: string) {
  if (!z.uuid().safeParse(value).success) throw new ApiError("http", 404);
  return value;
}
const collection = (org: string, site: string) =>
  `/api/organizations/${uuid(org)}/sites/${uuid(site)}/offers`;
const detail = (id: string) => `/api/offers/${uuid(id)}`;
function parseOffer(value: unknown, org: string, site: string, id?: string) {
  const parsed = offerSchema.safeParse(value);
  if (!parsed.success) throw new ApiError("invalid-response");
  if (
    parsed.data.organizationId !== org ||
    parsed.data.siteId !== site ||
    (id && parsed.data.offerId !== id)
  )
    throw new ApiError("http", 404);
  return parsed.data;
}
async function readOffer(
  request: typeof httpClient,
  org: string,
  site: string,
  id: string,
  signal?: AbortSignal,
) {
  return parseOffer(
    await request(detail(id), { signal, jsonCodec: offerJsonCodec }),
    org,
    site,
    id,
  );
}
export function useOffers(
  active: Membership,
  siteId: string,
  page: number,
  size: number,
) {
  const { request } = useAuth();
  const client = useQueryClient();
  return useQuery({
    queryKey: offerKeys.list(active.organizationId, siteId, page, size),
    enabled: offerCapabilities(active).canViewOffers,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      try {
        const site = await readSite(
          request,
          active.organizationId,
          siteId,
          signal,
        );
        const parsed = offerPageSchema.safeParse(
          await request(collection(active.organizationId, siteId), {
            signal,
            jsonCodec: offerJsonCodec,
            query: { page: String(page), size: String(size) },
          }),
        );
        if (
          !parsed.success ||
          parsed.data.page !== String(page) ||
          parsed.data.size !== String(size) ||
          parsed.data.content.length > size ||
          new Set(parsed.data.content.map((o) => o.offerId)).size !==
            parsed.data.content.length
        )
          throw new ApiError("invalid-response");
        for (const offer of parsed.data.content)
          if (
            offer.organizationId !== active.organizationId ||
            offer.siteId !== siteId
          )
            throw new ApiError("http", 404);
        return { ...parsed.data, site };
      } catch (error) {
        if (error instanceof ApiError && [401, 403].includes(error.status))
          void client.invalidateQueries({
            queryKey: membershipKeys.access(active.organizationId),
          });
        throw error;
      }
    },
  });
}
/**
 * Toutes les offres de l'organisation, site par site (le serveur ne liste que par site) : la
 * première page de 100 offres de chaque site, fusionnée dans l'ordre des sites.
 */
export function useAllOffers(active: Membership, siteIds: string[]) {
  const { request } = useAuth();
  const size = 100;
  return useQueries({
    queries: siteIds.map((siteId) => ({
      queryKey: offerKeys.list(active.organizationId, siteId, 0, size),
      enabled: offerCapabilities(active).canViewOffers,
      staleTime: 0,
      refetchOnWindowFocus: true,
      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        const site = await readSite(
          request,
          active.organizationId,
          siteId,
          signal,
        );
        const parsed = offerPageSchema.safeParse(
          await request(collection(active.organizationId, siteId), {
            signal,
            jsonCodec: offerJsonCodec,
            query: { page: "0", size: String(size) },
          }),
        );
        if (!parsed.success) throw new ApiError("invalid-response");
        for (const offer of parsed.data.content)
          if (
            offer.organizationId !== active.organizationId ||
            offer.siteId !== siteId
          )
            throw new ApiError("http", 404);
        return { ...parsed.data, site };
      },
    })),
    combine: (results) => ({
      isPending: results.some((r) => r.isPending),
      isFetching: results.some((r) => r.isFetching),
      error: results.find((r) => r.error)?.error ?? null,
      refetch: () => Promise.all(results.map((r) => r.refetch())),
      offers: results.flatMap((r) =>
        r.data
          ? r.data.content.map((offer) => ({ offer, site: r.data.site }))
          : [],
      ),
    }),
  });
}
/**
 * Site d'une offre, lu depuis l'offre elle-même : l'adresse d'une fiche d'offre ne contient
 * pas son site. Le rattachement est définitif, la réponse ne vieillit donc pas.
 */
export function useOfferSite(active: Membership, id: string) {
  const { request } = useAuth();
  return useQuery({
    queryKey: tenantKeys.resource(active.organizationId, "offer-site", id),
    enabled: offerCapabilities(active).canViewOffers,
    staleTime: Infinity,
    queryFn: async ({ signal }) => {
      const parsed = offerSchema.safeParse(
        await request(detail(id), { signal, jsonCodec: offerJsonCodec }),
      );
      if (!parsed.success) throw new ApiError("invalid-response");
      if (parsed.data.organizationId !== active.organizationId)
        throw new ApiError("http", 404);
      return parsed.data.siteId;
    },
  });
}
export function useOffer(active: Membership, siteId: string, id: string) {
  const { request } = useAuth();
  const client = useQueryClient();
  return useQuery({
    queryKey: offerKeys.detail(active.organizationId, siteId, id),
    enabled: offerCapabilities(active).canViewOffers,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      try {
        const site = await readSite(
          request,
          active.organizationId,
          siteId,
          signal,
        );
        const offer = await readOffer(
          request,
          active.organizationId,
          siteId,
          id,
          signal,
        );
        return { site, offer };
      } catch (error) {
        if (error instanceof ApiError && [401, 403].includes(error.status))
          void client.invalidateQueries({
            queryKey: membershipKeys.access(active.organizationId),
          });
        throw error;
      }
    },
  });
}
type Change =
  | { action: "create"; values: CreateValues; currency: string }
  | {
      action: EditKind;
      offer: Offer;
      values: Partial<CreateValues>;
      currency: string;
    }
  | { action: OfferAction; offer: Offer };
function policyBody(values: ReturnType<typeof policySchema.parse>) {
  return Object.fromEntries(
    Object.entries(values).map(([key, v]) => [
      key,
      v === "" ? null : new ExactNumber(v),
    ]),
  );
}
export function useOfferChange(active: Membership, siteId: string) {
  const { request } = useAuth();
  const client = useQueryClient();
  const mounted = useRef(true),
    lock = useRef(false),
    controller = useRef(new AbortController());
  useEffect(() => {
    mounted.current = true;
    controller.current = new AbortController();
    return () => {
      mounted.current = false;
      controller.current.abort();
    };
  }, []);
  const mutationKey = offerKeys.mutation(active.organizationId);
  const busy = useIsMutating({ mutationKey }) > 0;
  const mutation = useMutation({
    mutationKey,
    retry: false,
    mutationFn: async (change: Change) => {
      if (!offerCapabilities(active).canViewOffers)
        throw new ApiError("http", 403);
      const signal = controller.current.signal;
      const site = await readSite(
        request,
        active.organizationId,
        siteId,
        signal,
      );
      const organization = await readOrganization(
        request,
        active.organizationId,
        signal,
      );
      const current =
        change.action === "create"
          ? undefined
          : await readOffer(
              request,
              active.organizationId,
              siteId,
              change.offer.offerId,
              signal,
            );
      // There is no server version precondition. Detect observed changes before sending a stale command.
      if (
        current &&
        "offer" in change &&
        current.updatedAt !== change.offer.updatedAt
      )
        throw new ApiError("http", 409);
      const caps = offerCapabilities(
        active,
        site,
        current,
        organization.currency,
      );
      let url = collection(active.organizationId, siteId),
        method = "POST",
        body: unknown = undefined;
      if (change.action === "create") {
        if (!caps.canCreateOffer) throw new ApiError("http", 409);
        if (change.currency !== organization.currency)
          throw new ApiError("http", 409);
        const values = createSchema(organization.currency).parse(change.values);
        body = {
          name: values.name,
          description: values.description || null,
          amount: new ExactNumber(values.amount),
          currencyCode: organization.currency,
          ...policyBody(policySchema.parse(values)),
          displayOrder: new ExactNumber(values.displayOrder),
        };
      } else {
        url = detail(change.offer.offerId);
        if (
          change.action === "details" ||
          change.action === "price" ||
          change.action === "policy" ||
          change.action === "order"
        ) {
          if (
            !(change.action === "price"
              ? caps.canEditPrice
              : caps.canEditOffer) ||
            change.currency !== organization.currency
          )
            throw new ApiError("http", 409);
          method = "PATCH";
          if (change.action === "details")
            body = detailsSchema.parse(change.values);
          if (change.action === "price") {
            url += "/price";
            body = {
              amount: new ExactNumber(
                priceSchema(organization.currency).parse(change.values).amount,
              ),
              currencyCode: organization.currency,
            };
          }
          if (change.action === "policy") {
            url += "/access-policy";
            body = policyBody(policySchema.parse(change.values));
          }
          if (change.action === "order") {
            url += "/display-order";
            body = {
              displayOrder: new ExactNumber(
                orderSchema.parse(change.values).displayOrder,
              ),
            };
          }
        } else {
          if (!caps[change.action]) throw new ApiError("http", 409);
          const routes: Record<OfferAction, [string, string]> = {
            publish: ["POST", "/publication"],
            suspend: ["POST", "/suspension"],
            resume: ["DELETE", "/suspension"],
            archive: ["POST", "/archival"],
          };
          const command = routes[change.action];
          method = command[0];
          url += command[1];
        }
      }
      if (!mounted.current || signal.aborted) throw new ApiError("aborted");
      return parseOffer(
        await request(url, { method, body, signal, jsonCodec: offerJsonCodec }),
        active.organizationId,
        siteId,
        current?.offerId,
      );
    },
    onSettled: async (_data, error) => {
      if (!mounted.current) return;
      await client.invalidateQueries({
        queryKey: offerKeys.site(active.organizationId, siteId),
      });
      if (error instanceof ApiError && [401, 403].includes(error.status))
        await client.invalidateQueries({
          queryKey: membershipKeys.access(active.organizationId),
        });
    },
  });
  return {
    ...mutation,
    pending: busy || mutation.isPending,
    change: async (value: Change) => {
      if (lock.current || client.isMutating({ mutationKey })) return undefined;
      lock.current = true;
      try {
        const result = await mutation.mutateAsync(value);
        return mounted.current ? result : undefined;
      } finally {
        lock.current = false;
      }
    },
  };
}
