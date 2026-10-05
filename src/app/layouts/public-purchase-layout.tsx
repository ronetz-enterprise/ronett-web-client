import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/shared/api/query-client";
import { Outlet } from "react-router";
import { ErrorBoundary as ContentBoundary } from "@/shared/components/error-boundary";
export default function PublicPurchaseLayout() {
  // Session restoration/logout may clear the private cache; anonymous reading is independent.
  const [client] = useState(createQueryClient);
  useEffect(
    () => () => {
      void client.cancelQueries();
      client.clear();
    },
    [client],
  );
  return (
    <QueryClientProvider client={client}>
      <div className="flex min-h-svh flex-col bg-background text-foreground">
        <a
          href="#public-purchase-content"
          className="sr-only focus:not-sr-only focus:p-4"
        >
          Aller aux offres
        </a>
        <header className="border-b px-4 py-5">
          <div className="mx-auto max-w-3xl font-heading text-lg font-semibold">
            Ronetz
          </div>
        </header>
        <main
          id="public-purchase-content"
          className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-10"
        >
          <ContentBoundary>
            <Outlet />
          </ContentBoundary>
        </main>
        <footer className="border-t px-4 py-5 text-center text-xs text-muted-foreground">
          Consultez les offres depuis le lien fourni sur votre portail Wi-Fi.
        </footer>
      </div>
    </QueryClientProvider>
  );
}
export function ErrorBoundary() {
  return (
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <h1 className="font-heading text-xl font-semibold">
        Connexion indisponible
      </h1>
      <p>
        Cette page ne peut pas être affichée pour le moment. Réessayez depuis le
        lien de votre portail Wi-Fi.
      </p>
    </main>
  );
}
