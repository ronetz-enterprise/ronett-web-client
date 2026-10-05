import { useContext, useEffect } from "react";
import { UNSAFE_DataRouterContext, useBlocker } from "react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

type Guard = {
  /** Saisie modifiée et non enregistrée. */
  when: boolean;
  /** Lu au moment de la navigation : vrai pendant un envoi qui va lui-même rediriger. */
  bypass?: () => boolean;
};

function InAppGuard({ when, bypass }: Guard) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && !bypass?.() && currentLocation.pathname !== nextLocation.pathname,
  );
  return (
    <AlertDialog
      open={blocker.state === "blocked"}
      onOpenChange={(open) => {
        if (!open && blocker.state === "blocked") blocker.reset();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Quitter sans enregistrer ?</AlertDialogTitle>
          <AlertDialogDescription>
            Vos modifications seront perdues.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => blocker.reset?.()}>
            Continuer la saisie
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => blocker.proceed?.()}
          >
            Quitter
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Empêche de perdre une saisie : confirmation lors d'une navigation interne et alerte du
 * navigateur à la fermeture ou au rechargement. La navigation interne n'est interceptée que
 * sous un « data router » (l'application) ; les tests en `MemoryRouter` restent inchangés.
 */
export function UnsavedChangesGuard({ when, bypass }: Guard) {
  const dataRouter = useContext(UNSAFE_DataRouterContext);
  useEffect(() => {
    if (!when) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (bypass?.()) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [when, bypass]);
  return dataRouter ? <InAppGuard when={when} bypass={bypass} /> : null;
}
