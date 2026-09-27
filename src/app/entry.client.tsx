import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { config } from "@/shared/config/environment";
async function bootstrap() {
  if (import.meta.env.DEV && config.enableMocks) {
    const { worker } = await import("@/shared/testing/browser");
    await worker.start({ onUnhandledRequest: "bypass", quiet: true });
  }
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <HydratedRouter />
      </StrictMode>,
    );
  });
}
void bootstrap().catch(() => {
  // Bootstrap failures cannot enter a React boundary yet. Never expose raw errors.
  document.body.textContent =
    "Impossible de démarrer l’application. Rechargez la page ou vérifiez la configuration locale.";
});
