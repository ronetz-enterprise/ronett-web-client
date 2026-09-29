import { useLocation } from "react-router";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { useAuth } from "@/features/authentication";
import { createAttempt, type CreationAttempt } from "../lib/creation-attempt";
import type { AuthenticatedRequest } from "../api/create-organization";
import { usePrincipal } from "@/features/identity";
const OnboardingContext = createContext<CreationAttempt | null>(null);
function ActiveAttempt({
  request,
  userId,
  children,
}: {
  request: AuthenticatedRequest;
  userId: string;
  children: React.ReactNode;
}) {
  const [attempt] = useState(() => createAttempt(request, userId));
  const location = useLocation();
  const snapshot = useSyncExternalStore(
    attempt.subscribe,
    attempt.getSnapshot,
    attempt.getSnapshot,
  );
  useEffect(() => () => attempt.dispose(), [attempt]);
  useEffect(() => {
    if (
      snapshot.status === "created" &&
      snapshot.organization &&
      location.pathname === "/app/" + snapshot.organization.id
    )
      attempt.complete();
  }, [attempt, location.pathname, snapshot]);
  return (
    <OnboardingContext.Provider value={attempt}>
      {children}
    </OnboardingContext.Provider>
  );
}
export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, request } = useAuth();
  const principal = usePrincipal();
  // Survives route changes and token rotation, but is destroyed with the session.
  return principal.data &&
    (status === "authenticated" || status === "refreshing") ? (
    <ActiveAttempt
      key={principal.data.userId}
      userId={principal.data.userId}
      request={request}
    >
      {children}
    </ActiveAttempt>
  ) : (
    children
  );
}
export function useCreationAttempt() {
  const attempt = useContext(OnboardingContext);
  if (!attempt) throw new Error("Session authentifiée requise.");
  const snapshot = useSyncExternalStore(
    attempt.subscribe,
    attempt.getSnapshot,
    attempt.getSnapshot,
  );
  return {
    ...snapshot,
    submit: attempt.submit,
    recover: attempt.recover,
    complete: attempt.complete,
  };
}
