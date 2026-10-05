import { useRef, useState } from "react";
import type { Membership } from "@/features/memberships";
import { notificationManager } from "@/shared/components/notifications";
import { Button } from "@/shared/ui/button";
import {
  SettingsActionRow,
  SettingsCard,
  SettingsSection,
} from "@/shared/components/settings-layout";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/shared/ui/alert-dialog";
import { siteCapabilities, type Site, type SiteAction } from "../model/site";
import { useSiteChange } from "../queries/sites";
import { SiteFailure } from "./site-shared";

const rows: Record<
  SiteAction,
  { title: string; summary: string; impact: string; button: string }
> = {
  suspend: {
    title: "Suspendre le site",
    summary: "Le portail ne vend plus d’accès. Vous pourrez le réactiver.",
    impact:
      "Tant que le site est suspendu, son portail ne vend plus d’accès et vous ne pouvez plus y ajouter de routeur ni d’offre. Vous pourrez le réactiver à tout moment.",
    button: "Suspendre",
  },
  reactivate: {
    title: "Réactiver le site",
    summary: "Le portail du site recommence à vendre des accès.",
    impact:
      "Le site redevient actif : son portail peut de nouveau vendre des accès.",
    button: "Réactiver",
  },
  close: {
    title: "Fermer le site",
    summary: "Définitif : le site ne pourra plus être modifié ni réactivé.",
    impact:
      "La fermeture est définitive : le site ne pourra plus être modifié ni réactivé, et son portail ne vendra plus d’accès.",
    button: "Fermer",
  },
};

/** Section « Gestion du site » : une ligne par action possible, confirmée par un dialogue. */
export function SiteManagement({
  active,
  site,
}: {
  active: Membership;
  site: Site;
}) {
  const [selection, setSelection] = useState<SiteAction | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const mutation = useSiteChange(active);
  const caps = siteCapabilities(active, site);
  const actions = (["suspend", "reactivate", "close"] as const).filter(
    (action) => caps[action],
  );
  if (!actions.length && !selection) return null;
  async function confirm() {
    if (!selection || !caps[selection]) return;
    try {
      const result = await mutation.change({ action: selection, site });
      if (!result.applied) return;
      setSelection(null);
      notificationManager.add({
        title: "État du site mis à jour",
        description: site.name,
      });
    } catch {
      /* Kept in the dialog with the original safe ProblemDetail. */
    }
  }
  return (
    <>
      <SettingsSection
        id="gestion"
        title="Gestion du site"
        description="Chaque action est confirmée avant d’être appliquée."
      >
        <SettingsCard>
          {actions.map((action) => (
            <SettingsActionRow
              key={action}
              title={rows[action].title}
              description={rows[action].summary}
              action={
                <Button
                  variant={action === "close" ? "destructive" : "outline"}
                  disabled={mutation.pending}
                  aria-label={rows[action].title}
                  onClick={(event) => {
                    trigger.current = event.currentTarget;
                    mutation.reset();
                    setSelection(action);
                  }}
                >
                  {rows[action].button}
                </Button>
              }
            />
          ))}
        </SettingsCard>
      </SettingsSection>
      <AlertDialog
        open={!!selection}
        onOpenChange={(open) => {
          if (!open && !mutation.pending) setSelection(null);
        }}
      >
        <AlertDialogContent finalFocus={trigger}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selection ? rows[selection].title : "Modifier le site"} ?
            </AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              Site : {site.name}. {selection && rows[selection].impact}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {mutation.isError && <SiteFailure error={mutation.error} />}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.pending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={mutation.pending || !selection || !caps[selection]}
              variant={selection === "close" ? "destructive" : "default"}
              onClick={() => void confirm()}
            >
              {mutation.pending ? "En cours…" : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
