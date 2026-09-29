import { useRef, useState } from "react";
import { z } from "zod";
import { ApiError } from "@/shared/errors/api-error";
import type { Membership } from "@/features/memberships";
import type { Site } from "@/features/site";
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
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { notificationManager } from "@/shared/components/notifications";
import {
  routerCapabilities,
  actionLabels,
  type Router,
  type RouterAction,
} from "../model/router";
import { useRouterChange } from "../queries/routers";
import { RouterFailure } from "./router-shared";

const receiptSchema = z.object({
  action: z.enum(["provision", "artifact", "suspend", "resume", "revoke"]),
  key: z.uuid(),
});
type Receipt = z.infer<typeof receiptSchema>;
const explanations: Record<RouterAction, string> = {
  provision:
    "Le backend enregistrera une demande de provisioning. Le parcours ne sera terminé qu’après confirmation serveur. L’exécution réseau n’est pas encore raccordée dans cette version.",
  artifact:
    "Cette commande demande un nouvel artefact et peut remplacer la référence précédente. L’impact sur une ancienne configuration n’est pas précisé par le contrat. Aucun contenu de script ne pourra être récupéré depuis cette interface.",
  suspend:
    "L’accès métier sera suspendu dès l’acceptation. Cela ne confirme pas une coupure réseau sur l’équipement. Une demande de réactivation pourra ensuite être envoyée.",
  resume:
    "Le routeur ne redeviendra actif qu’après confirmation technique du backend. Cette demande ne garantit pas sa connectivité.",
  revoke:
    "L’accès métier sera suspendu immédiatement. Une révocation confirmée est définitive et interdit les modifications. La prise d’effet réseau doit être confirmée par le backend.",
};
export function RouterActions({
  active,
  router,
  site,
  expectedSite,
  onAccepted,
}: {
  active: Membership;
  router: Router;
  site: Site | null;
  expectedSite?: string;
  onAccepted: (action: RouterAction, before: Router) => void;
}) {
  const storageKey = `ronetz.router-intent.${active.organizationId}.${router.id}`;
  const [receipt, setReceipt] = useState<Receipt | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const value = receiptSchema.safeParse(
        JSON.parse(sessionStorage.getItem(storageKey) ?? "null"),
      );
      return value.success ? value.data : null;
    } catch {
      return null;
    }
  });
  const [selection, setSelection] = useState<RouterAction | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const mutation = useRouterChange(active),
    caps = routerCapabilities(active, router, site);
  const actions = (
    ["provision", "artifact", "suspend", "resume", "revoke"] as const
  ).filter((action) => caps[action]);
  function saveReceipt(value: Receipt | null) {
    setReceipt(value);
    try {
      if (value) sessionStorage.setItem(storageKey, JSON.stringify(value));
      else sessionStorage.removeItem(storageKey);
    } catch {
      /* The current mounted screen still retains the key. */
    }
  }
  async function confirm() {
    if (!selection) return;
    const intent = receipt ?? { action: selection, key: crypto.randomUUID() };
    if (intent.action !== selection) return;
    saveReceipt(intent);
    try {
      const result = await mutation.change({
        action: intent.action,
        router,
        key: intent.key,
        expectedSite,
      });
      if (!result) return;
      saveReceipt(null);
      setSelection(null);
      onAccepted(intent.action, router);
      notificationManager.add({
        title: "Demande acceptée",
        description: "L’exécution technique reste à confirmer.",
      });
    } catch (error) {
      if (
        error instanceof ApiError &&
        [400, 403, 404, 409, 422].includes(error.status)
      )
        saveReceipt(null); /* Only uncertain results retain the original key. */
    }
  }
  if (!caps.canCreateRouter) return null;
  return (
    <div className="space-y-3">
      {actions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            ref={trigger}
            render={
              <Button
                variant="outline"
                disabled={mutation.pending || !!receipt}
                aria-label={`Commandes pour ${router.name}`}
              />
            }
          >
            Commandes
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {actions.map((action) => (
              <DropdownMenuItem
                key={action}
                variant={action === "revoke" ? "destructive" : "default"}
                onClick={() => {
                  mutation.reset();
                  setSelection(action);
                }}
              >
                {action === "provision" &&
                router.provisioningStatus === "FAILED"
                  ? "Relancer le provisioning"
                  : actionLabels[action]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {receipt && !selection && (
        <Alert>
          <AlertTitle>Réponse de commande non confirmée</AlertTitle>
          <AlertDescription>
            Une intention précédente a été conservée. Rejouer cette demande
            utilise sa même clé d’idempotence et ne crée pas une nouvelle
            intention.
            <Button
              variant="outline"
              disabled={mutation.pending}
              onClick={() => setSelection(receipt.action)}
            >
              Rejouer la même demande
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <AlertDialog
        open={!!selection}
        onOpenChange={(open) => {
          if (!open && !mutation.pending) setSelection(null);
        }}
      >
        <AlertDialogContent finalFocus={trigger}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selection ? actionLabels[selection] : "Commande routeur"} ?
            </AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              Routeur : {router.name}. {selection && explanations[selection]}{" "}
              Confirmez pour envoyer la demande.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {mutation.isError && <RouterFailure error={mutation.error} />}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.pending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              variant={selection === "revoke" ? "destructive" : "default"}
              disabled={mutation.pending || !selection}
              onClick={() => void confirm()}
            >
              {mutation.pending
                ? "Envoi…"
                : receipt
                  ? "Rejouer avec la même clé"
                  : "Confirmer la demande"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
