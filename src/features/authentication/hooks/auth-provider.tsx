import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createSession, type Session } from "../lib/session";
const AuthContext = createContext<Session | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const cache = useQueryClient();
  const [session] = useState(() =>
    createSession({
      clearCache: () => {
        void cache.cancelQueries();
        cache.clear();
      },
    }),
  );
  useEffect(() => session.start(), [session]);
  return (
    <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
  );
}
export function useAuth() {
  const session = useContext(AuthContext);
  if (!session) throw new Error("AuthProvider requis.");
  const snapshot = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getSnapshot,
  );
  return {
    ...snapshot,
    restore: session.restore,
    login: session.login,
    logout: session.logout,
    refresh: session.refresh,
    request: session.request,
  };
}
