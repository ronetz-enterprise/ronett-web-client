import { useRef, useState } from "react";
import type { Membership } from "@/features/memberships";
import { notificationManager } from "@/shared/components/notifications";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/ui/dropdown-menu";
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
import {
  siteActionLabels,
  siteCapabilities,
  type Site,
  type SiteAction,
} from "../model/site";
import { useSiteChange } from "../queries/sites";
import { SiteFailure } from "./site-shared";

export function SiteActions({
  active,
  site,
}: {
  active: Membership;
  site: Site;
}) {
  const [selection, setSelection] = useState<SiteAction | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
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
      <DropdownMenu>
        <DropdownMenuTrigger
          ref={trigger}
          render={
            <Button
              variant="outline"
              disabled={mutation.pending}
              aria-label={`Actions pour ${site.name}`}
            />
          }
        >
          Actions
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action) => (
            <DropdownMenuItem
              key={action}
              variant={action === "close" ? "destructive" : "default"}
              onClick={() => {
                mutation.reset();
                setSelection(action);
              }}
            >
              {siteActionLabels[action]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog
        open={!!selection}
        onOpenChange={(open) => {
          if (!open && !mutation.pending) setSelection(null);
        }}
      >
        <AlertDialogContent finalFocus={trigger}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selection ? siteActionLabels[selection] : "Modifier le site"} ?
            </AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              Site : {site.name}.{" "}
              {selection === "close"
                ? "La fermeture est définitive. Le site ne pourra plus être modifié ou réactivé, et les opérations exigeant un site actif seront refusées. Confirmez pour fermer ce site."
                : selection === "suspend"
                  ? "Les opérations exigeant un site actif seront refusées. Cette action est réversible : vous pourrez réactiver le site depuis son détail. Confirmez pour le suspendre."
                  : "Le site redeviendra actif et pourra à nouveau être utilisé pour les opérations exigeant cet état. Confirmez pour le réactiver."}
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
