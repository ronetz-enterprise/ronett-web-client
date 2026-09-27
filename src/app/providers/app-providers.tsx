import { ThemeProvider } from "./theme-provider";
import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/shared/api/query-client";
import { ErrorBoundary } from "@/shared/components/error-boundary";
import { NotificationProvider } from "@/shared/components/notifications";
import { TooltipProvider } from "@/shared/ui/tooltip";
export function AppProviders({ children }: { children: React.ReactNode }) {
  // A new cache for each SSR tree; never a server-wide singleton.
  const [client] = useState(createQueryClient);
  return (
    <ErrorBoundary>
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <TooltipProvider>
            <NotificationProvider>{children}</NotificationProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
