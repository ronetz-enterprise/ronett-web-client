import { startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { config } from "@/shared/config/environment";
async function bootstrap() {
  if (import.meta.env.DEV && config.enableMocks) {
    const { worker } = await import("@/shared/testing/browser");
    await worker.start({ onUnhandledRequest: "bypass", quiet: true });
  }
  startTransition(() => {
    hydrateRoot(document, <HydratedRouter />);
  });
}
void bootstrap().catch(() => {
  document.body.textContent =
    "Impossible de demarrer l'application. Rechargez la page ou verifiez la configuration locale.";
});
