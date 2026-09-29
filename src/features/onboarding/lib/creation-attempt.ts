import { z } from "zod";
import type { Organization } from "@/features/organizations";
import { ApiError } from "@/shared/errors/api-error";
import {
  createOrganization,
  type AuthenticatedRequest,
} from "../api/create-organization";
import {
  createOrganizationSchema,
  toCreateOrganizationDto,
  type CreateOrganizationInput,
} from "../schemas/create-organization";
const intentionSchema = z.object({
  key: z.uuid(),
  input: createOrganizationSchema,
});
export type Intention = z.infer<typeof intentionSchema>;
export type AttemptState = {
  status: "idle" | "creating" | "created" | "failed" | "unknown";
  organization?: Organization;
  error?: unknown;
  intention?: Intention;
  storageUnavailable?: boolean;
};
export function createAttempt(request: AuthenticatedRequest, userId?: string) {
  const storageKey = userId ? "ronetz.onboarding." + userId : undefined;
  let state: AttemptState = { status: "idle" };
  // Only this user's non-secret pending intention is read. No token or membership is persisted.
  if (storageKey && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = intentionSchema.safeParse(JSON.parse(stored));
        if (parsed.success)
          state = { status: "unknown", intention: parsed.data };
        else
          state = {
            status: "unknown",
            error: new ApiError("invalid-response"),
          };
      }
    } catch {
      state = { status: "unknown", storageUnavailable: true };
    }
  }
  let generation = 0;
  const listeners = new Set<() => void>();
  const publish = (next: AttemptState) => {
    state = next;
    listeners.forEach((fn) => fn());
  };
  function persist(intention: Intention) {
    if (!storageKey) return true;
    try {
      localStorage.setItem(storageKey, JSON.stringify(intention));
      return true;
    } catch {
      return false;
    }
  }
  function remove() {
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* Keep a safe replayable intention if storage is unavailable. */
      }
    }
  }
  async function send(intention: Intention) {
    const expected = generation;
    const durable = persist(intention);
    publish({ status: "creating", intention, storageUnavailable: !durable });
    try {
      const organization = await createOrganization(
        request,
        intention.input,
        intention.key,
      );
      if (expected !== generation) return false;
      publish({
        status: "created",
        intention,
        organization,
        storageUnavailable: !durable,
      });
    } catch (error) {
      if (expected !== generation) return false;
      const code = error instanceof ApiError ? error.problem?.code : undefined;
      const rejected =
        error instanceof ApiError &&
        error.kind === "http" &&
        [400, 403, 404, 422, 429].includes(error.status);
      const terminalKey =
        code === "IDEMPOTENCY_CONFLICT" || code === "IDEMPOTENCY_KEY_EXPIRED";
      if (rejected) remove();
      publish({
        status: rejected && !terminalKey ? "failed" : "unknown",
        intention,
        error,
        storageUnavailable: !durable,
      });
    }
    return true;
  }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      generation++;
    },
    submit(input: CreateOrganizationInput) {
      if (!["idle", "failed"].includes(state.status))
        return Promise.resolve(false);
      const dto = toCreateOrganizationDto(input);
      const previous = state.intention;
      const intention =
        previous && JSON.stringify(previous.input) === JSON.stringify(dto)
          ? previous
          : { key: crypto.randomUUID(), input: dto };
      return send(intention);
    },
    recover() {
      if (state.status !== "unknown" || !state.intention)
        return Promise.resolve(false);
      const code =
        state.error instanceof ApiError ? state.error.problem?.code : undefined;
      if (code === "IDEMPOTENCY_CONFLICT" || code === "IDEMPOTENCY_KEY_EXPIRED")
        return Promise.resolve(false);
      return send(state.intention);
    },
    complete() {
      remove();
      publish({ status: "idle" });
    },
  };
}
export type CreationAttempt = ReturnType<typeof createAttempt>;
