import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/authentication";
import { ApiError } from "@/shared/errors/api-error";
export const principalSchema = z.object({
  userId: z.uuid(),
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
  status: z.literal("ACTIVE"),
  platformAdmin: z.boolean(),
});
export function usePrincipal() {
  const auth = useAuth();
  return useQuery({
    queryKey: ["identity", "current"],
    enabled: auth.status === "authenticated" || auth.status === "refreshing",
    retry: false,
    queryFn: async ({ signal }) => {
      const result = principalSchema.safeParse(
        await auth.request("/api/me", { signal }),
      );
      if (!result.success) throw new ApiError("invalid-response");
      return result.data;
    },
  });
}
