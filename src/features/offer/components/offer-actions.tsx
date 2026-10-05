import { FormDialogContext } from "@/shared/components/form-dialog-context";
import { useRef, useState } from "react";
import type { Membership } from "@/features/memberships";
import type { Site } from "@/features/site";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
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
import { notificationManager } from "@/shared/components/notifications";
import {
  offerCapabilities,
  type Offer,
  type OfferAction,
} from "../model/offer";
import { useOfferChange } from "../queries/offers";
import { formatPrice } from "../formatters/offer";
import { AccessPolicySummary, OfferFailure } from "./offer-shared";
const labels: Record<OfferAction, string> = {
  publish: "Publier",
  suspend: "Suspendre",
  resume: "Réactiver",
  archive: "Archiver",
};
const impacts: Record<OfferAction, string> = {
  publish:
    "L’offre publiée pourra être proposée pour de nouveaux achats sur ce site, sous réserve de l’éligibilité vérifiée par le serveur.",
  suspend:
    "La suspension empêche de nouveaux achats de cette offre. Les achats existants ne sont pas modifiés.",
  resume:
    "L’offre sera de nouveau publiée pour ce site, sous réserve des conditions vérifiées par le serveur.",
  archive:
    "L’archivage est définitif. Cette offre ne pourra plus être modifiée ni publiée. Les achats existants ne sont pas modifiés.",
};
export function OfferActions({
  active,
  site,
  offer,
  currency,
}: {
  active: Membership;
  site: Site;
  offer: Offer;
  currency: string;
}) {
  const [action, setAction] = useState<OfferAction | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const mutation = useOfferChange(active, site.id);
  const caps = offerCapabilities(active, site, offer, currency);
  const available = (Object.keys(labels) as OfferAction[]).filter(
    (a) => caps[a],
  );
  if (!available.length) return null;
  const primary = available.find((a) => a !== "archive");
  const others = available.filter((a) => a !== primary);
  function open(next: OfferAction) {
    mutation.reset();
    setAction(next);
  }
  async function confirm() {
    if (!action) return;
    try {
      const result = await mutation.change({ action, offer });
      if (result) {
        setAction(null);
        notificationManager.add({ title: "Statut de l’offre mis à jour" });
      }
    } catch {
      /* Error remains in the dialog. */
    }
  }
  return (
    <>
      {/* L'action de statut courante est visible ; le reste (archiver) passe par « ⋯ ». */}
      {primary && (
        <Button
          ref={trigger}
          variant={primary === "suspend" ? "outline" : "default"}
          disabled={mutation.pending}
          onClick={() => open(primary)}
        >
          {labels[primary]}
        </Button>
      )}
      {others.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                aria-label="Autres actions"
                disabled={mutation.pending}
              />
            }
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={1.75} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {others.map((a) => (
              <DropdownMenuItem
                key={a}
                variant={a === "archive" ? "destructive" : undefined}
                onClick={() => open(a)}
              >
                {labels[a]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <AlertDialog
        open={!!action}
        onOpenChange={(open) => {
          if (!open && !mutation.pending) setAction(null);
        }}
      >
        <AlertDialogContent
          finalFocus={trigger}
          className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 text-sm data-[size=default]:sm:max-w-[400px]"
        >
          <AlertDialogHeader className="gap-1.5 border-b px-6 pt-6 pb-5 text-left">
            <AlertDialogTitle className="text-base font-semibold">
              {action ? labels[action] : "Confirmer"} l’offre
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {action && impacts[action]}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {/* Corps défilant sur une colonne, comme les modales de formulaire. */}
          <FormDialogContext.Provider
            value={{ close: () => !mutation.pending && setAction(null) }}
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
              <p className="break-words font-medium">
                {offer.name} · {site.name}
              </p>
              <p>{formatPrice(offer.price.amount, offer.price.currencyCode)}</p>
              <AccessPolicySummary policy={offer.accessPolicy} />
              {mutation.isError && <OfferFailure error={mutation.error} />}
            </div>
          </FormDialogContext.Provider>
          <AlertDialogFooter className="m-0 flex-row justify-end gap-2 rounded-none border-t bg-popover px-6 py-4 [&_button]:min-h-10">
            <AlertDialogCancel disabled={mutation.pending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={mutation.pending || !action || !caps[action]}
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
