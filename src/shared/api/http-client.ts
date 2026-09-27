import { config } from "@/shared/config/environment";
import {
  ApiError,
  extractCorrelationId,
  parseProblemDetail,
} from "@/shared/errors/api-error";
type RequestOptions = Omit<
  RequestInit,
  "body" | "credentials" | "signal" | "redirect"
> & {
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
  accessToken?: string;
};
export function createHttpClient(baseUrl: string) {
  return async function request<T = unknown>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    // Never forward bearer tokens to an arbitrary origin.
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\"))
      throw new Error("Chemin API relatif requis.");
    const { body, signal, timeoutMs = 15_000, accessToken, ...init } = options;
    const headers = new Headers(init.headers);
    if (!headers.has("Accept"))
      headers.set("Accept", "application/json, application/problem+json");
    if (body !== undefined) headers.set("Content-Type", "application/json");
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    let response: Response | undefined;
    try {
      response = await fetch(`${baseUrl.replace(/\/+$/, "")}${path}`, {
        ...init,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        credentials: "omit",
        redirect: "error",
        cache: "no-store",
        signal: controller.signal,
      });
      if (response.status === 204) return undefined as T;
      const text = await response.text();
      const json = response.headers
        .get("Content-Type")
        ?.toLowerCase()
        .includes("json");
      let value: unknown = text;
      if (json && text) {
        try {
          value = JSON.parse(text);
        } catch {
          if (response.ok)
            throw new ApiError(
              "invalid-response",
              response.status,
              undefined,
              extractCorrelationId(response.headers),
            );
        }
      }
      if (!response.ok) {
        const problem = parseProblemDetail(value);
        throw new ApiError(
          "http",
          response.status,
          problem,
          extractCorrelationId(response.headers, problem),
        );
      }
      return value as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        timedOut
          ? "timeout"
          : controller.signal.aborted
            ? "aborted"
            : "network",
        response?.status,
        undefined,
        response && extractCorrelationId(response.headers),
      );
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
    }
  };
}
export const httpClient = createHttpClient(config.apiBaseUrl);
