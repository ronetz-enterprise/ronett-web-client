import { useState } from "react";
import type { Membership } from "@/features/memberships";
import type { Site } from "@/features/site";
import { notificationManager } from "@/shared/components/notifications";
import { Button } from "@/shared/ui/button";
import {
  SettingsActionRow,
  SettingsCard,
  SettingsSection,
} from "@/shared/components/settings-layout";
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
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { ApiError, toUserMessage } from "@/shared/errors/api-error";
import { CorrelationIdDisplay } from "@/shared/components/feedback";
import type { AccessTransition } from "../api/access-endpoints";
import { useAccessChanges } from "../mutations/access-changes";
import type { AccessGrant } from "../model/access-grant";
import { accessPermissions } from "../permissions/access-permissions";

type Copy = {
  /** Titre de la ligne et du dialogue de confirmation. */
  title: string;
  /** Conséquence en une phrase, sur la ligne d'action. */
  summary: string;
  /** Conséquence détaillée, dans le dialogue (seulement ce que le service garantit). */
  impact: string;
  /** Libellé court du bouton de la ligne. */
  button: string;
  confirm: string;
  tone?: "destructive";
};

const transitions: Record<AccessTransition, Copy> = {
  suspend: {
    title: "Suspendre l’accès",
    summary: "Le client ne peut plus se connecter. Vous pourrez le reprendre.",
    impact:
      "Le client ne pourra plus se connecter avec cet accès. Une connexion déjà ouverte peut continuer jusqu’à ce qu’elle se termine. Vous pourrez reprendre l’accès plus tard.",
    button: "Suspendre",
    confirm: "Suspendre l’accès",
  },
  resume: {
    title: "Reprendre l’accès",
    summary: "Le client pourra de nouveau se connecter.",
    impact:
      "Le client pourra de nouveau se connecter dès que le réseau du site aura pris en compte la reprise. D’ici là, l’accès reste affiché comme suspendu.",
    button: "Reprendre",
    confirm: "Reprendre l’accès",
  },
  revoke: {
    title: "Annuler l’accès",
    summary: "Définitif : le client ne pourra plus jamais l’utiliser.",
    impact:
      "Le client ne pourra plus jamais se connecter avec cet accès. Cette action est définitive. Une connexion déjà ouverte peut continuer jusqu’à ce qu’elle se termine.",
    button: "Annuler",
    confirm: "Annuler définitivement",
    tone: "destructive",
  },
  retryProjection: {
    title: "Relancer l’activation",
    summary: "Ronetz réessaie de mettre à jour l’accès sur le réseau du site.",
    impact:
      "Ronetz réessaie tout de suite la dernière mise à jour en attente sur le réseau du site pour cet accès (activation, suspension, fin ou annulation).",
    button: "Relancer",
    confirm: "Relancer",
  },
};

/** Section « Gestion de l'accès » : une ligne par action possible, confirmée par un dialogue. */
export function AccessTransitions({
  active,
  grant,
  site,
}: {
  active: Membership;
  grant: AccessGrant;
  site: Site | null;
}) {
  const [selection, setSelection] = useState<AccessTransition | null>(null);
  const [error, setError] = useState<unknown>();
  // Une seule tentative par ouverture : le dialogue reste ouvert après un 503
  // afin que l'issue soit lue, mais le clic ne peut pas rejouer la commande.
  // Revenir délibérément dans le menu est une nouvelle action explicite.
  const [attempted, setAttempted] = useState(false);
  const mutation = useAccessChanges(active);
  const permissions = accessPermissions(active, grant);
  const available = (
    ["suspend", "resume", "revoke", "retryProjection"] as const
  ).filter((transition) =>
    transition === "suspend"
      ? permissions.canSuspendAccess
      : transition === "resume"
        ? permissions.canResumeAccess
        : transition === "revoke"
          ? permissions.canRevokeAccess
          : permissions.canRetryProvisioning,
  );
  if (!available.length) return null;
  const copy = selection ? transitions[selection] : null;
  return (
    <>
      <SettingsSection
        id="gestion"
        title="Gestion de l’accès"
        description="Chaque action est confirmée avant d’être appliquée."
      >
        <SettingsCard>
          {available.map((transition) => (
            <SettingsActionRow
              key={transition}
              title={transitions[transition].title}
              description={transitions[transition].summary}
              action={
                <Button
                  variant={
                    transitions[transition].tone === "destructive"
                      ? "destructive"
                      : "outline"
                  }
                  disabled={mutation.pending}
                  aria-label={transitions[transition].title}
                  onClick={() => {
                    setError(undefined);
                    setAttempted(false);
                    setSelection(transition);
                  }}
                >
                  {transitions[transition].button}
                </Button>
              }
            />
          ))}
        </SettingsCard>
      </SettingsSection>

      <AlertDialog
        // Le dialogue reste ouvert pendant la mutation et tant qu'un échec doit
        // être lu : la fermeture automatique du composant de base ne doit pas
        // masquer une intention enregistrée avec une application en attente.
        open={selection !== null || mutation.pending || error !== undefined}
        onOpenChange={(open) => {
          if (mutation.pending) return;
          if (open) return;
          setSelection(null);
          setError(undefined);
          setAttempted(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy?.impact}
              {site ? ` Site : ${site.name}.` : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error !== undefined && (
            <div className="space-y-2">
              <Alert variant="destructive">
                <AlertTitle>
                  {error instanceof ApiError && error.status === 503
                    ? "Demande enregistrée, réseau pas encore mis à jour"
                    : "L’action n’a pas abouti"}
                </AlertTitle>
                <AlertDescription>
                  <p>
                    {error instanceof ApiError && error.status === 503
                      ? "Votre demande est enregistrée, mais le réseau du site n’a pas encore été mis à jour. L’accès garde son état précédent jusque-là ; Ronetz réessaie automatiquement."
                      : toUserMessage(error)}
                  </p>
                </AlertDescription>
              </Alert>
              {error instanceof ApiError && error.correlationId && (
                <CorrelationIdDisplay correlationId={error.correlationId} />
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.pending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              variant={copy?.tone === "destructive" ? "destructive" : "default"}
              disabled={mutation.pending || !selection || attempted}
              onClick={async () => {
                if (!selection || mutation.pending || attempted) return;
                setError(undefined);
                setAttempted(true);
                try {
                  const result = await mutation.change({
                    transition: selection,
                    accessGrantId: grant.accessGrantId,
                  });
                  if (!result.applied) return;
                  setSelection(null);
                  notificationManager.add({
                    title: transitions[selection].title,
                    description: "L’état de l’accès est à jour.",
                  });
                } catch (failure) {
                  setError(failure);
                }
              }}
            >
              {mutation.pending
                ? "En cours…"
                : attempted
                  ? "Demande envoyée"
                  : copy?.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
