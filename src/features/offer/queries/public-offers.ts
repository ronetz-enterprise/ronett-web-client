import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/shared/api/http-client";
import { ApiError } from "@/shared/errors/api-error";
import { offerJsonCodec } from "../api/exact-json";
import {
  offerSchema,
  integerText,
  LONG_MAX,
  priceSchema,
} from "../model/offer";
const fields = offerSchema.shape;
const publicOfferSchema = z
  .object({
    offerId: fields.offerId,
    siteId: fields.siteId,
    name: fields.name,
    description: fields.description,
    price: fields.price,
    accessPolicy: fields.accessPolicy,
    displayOrder: fields.displayOrder,
  })
  .refine(
    (offer) =>
      priceSchema(offer.price.currencyCode).safeParse({
        amount: offer.price.amount,
      }).success,
  );
export type PublicOffer = z.infer<typeof publicOfferSchema>;
const publicPageSchema = z.object({
  content: z.array(publicOfferSchema),
  page: integerText(0n, 2147483647n),
  size: integerText(1n, 100n),
  totalElements: integerText(0n, LONG_MAX),
});
function uuid(value: string) {
  if (!z.uuid().safeParse(value).success) throw new ApiError("http", 404);
  return value;
}
const base = (site: string) => `/api/public/sites/${uuid(site)}/offers`;
export function usePublicOffers(siteId: string, page: number) {
  return useQuery({
    queryKey: ["public-offers", siteId, { page, size: 20 }],
    staleTime: 0,
    gcTime: 60000,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      const parsed = publicPageSchema.safeParse(
        await httpClient(base(siteId), {
          signal,
          credentials: "omit",
          query: { page: String(page), size: "20" },
          jsonCodec: offerJsonCodec,
        }),
      );
      if (
        !parsed.success ||
        parsed.data.page !== String(page) ||
        parsed.data.size !== "20" ||
        parsed.data.content.length > 20 ||
        parsed.data.content.some((o) => o.siteId !== siteId) ||
        new Set(parsed.data.content.map((o) => o.offerId)).size !==
          parsed.data.content.length
      )
        throw new ApiError("invalid-response");
      return parsed.data;
    },
  });
}
export function usePublicOffer(siteId: string, offerId: string) {
  return useQuery({
    queryKey: ["public-offer", siteId, offerId],
    staleTime: 0,
    gcTime: 60000,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      const parsed = publicOfferSchema.safeParse(
        await httpClient(`${base(siteId)}/${uuid(offerId)}`, {
          signal,
          credentials: "omit",
          jsonCodec: offerJsonCodec,
        }),
      );
      if (!parsed.success) throw new ApiError("invalid-response");
      if (parsed.data.siteId !== siteId || parsed.data.offerId !== offerId)
        throw new ApiError("http", 404);
      return parsed.data;
    },
  });
}
