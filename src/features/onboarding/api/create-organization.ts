import { organizationSchema } from "@/features/organizations";
import { ApiError } from "@/shared/errors/api-error";
import type { RequestOptions } from "@/shared/api/http-client";
import {
  toCreateOrganizationDto,
  type CreateOrganizationInput,
} from "../schemas/create-organization";
export type AuthenticatedRequest = <T = unknown>(
  path: string,
  options?: Omit<RequestOptions, "accessToken">,
) => Promise<T>;
export async function createOrganization(
  request: AuthenticatedRequest,
  input: CreateOrganizationInput,
  key: string,
) {
  // Actor and OWNER are determined exclusively by the server.
  const response = await request("/api/organizations", {
    method: "POST",
    headers: { "Idempotency-Key": key },
    body: toCreateOrganizationDto(input),
  });
  const result = organizationSchema.safeParse(response);
  if (!result.success) throw new ApiError("invalid-response");
  return result.data;
}
