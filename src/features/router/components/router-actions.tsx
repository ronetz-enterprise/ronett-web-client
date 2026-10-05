import { useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { ApiError } from "@/shared/errors/api-error";
import type { Membership } from "@/features/memberships";
import type { Site } from "@/features/site";
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
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { notificationManager } from "@/shared/components/notifications";
import {
  routerCapabilities,
  actionLabels,
  setupStage,
  type Router,
  type RouterAction,
} from "../model/router";
import {
  routerKeys,
  useRouterArtifactDownload,
  useRouterChange,
} from "../queries/routers";
import { RouterFailure } from "./router-shared";
import { RouterSetupGuide } from "./router-setup";

const receiptSchema = z.object({
  action: z.enum(["provision", "artifact", "suspend", "resume", "revoke"]),
  key: z.uuid(),
});
type Receipt = z.infer<typeof receiptSchema>;
const explanations: Record<RouterAction, string> = {
  provision:
    "Ronetz va préparer un script d’installation propre à ce routeur. Vous pourrez le télécharger dès qu’il sera prêt.",
  artifact:
    "Un nouveau script remplace le précédent, qui ne sera plus utilisable. Il restera téléchargeable pendant 15 minutes.",
  suspend:
    "Vos clients ne pourront plus acheter d’accès via ce routeur. Vous pourrez le réactiver ensuite.",
  resume:
    "Le routeur pourra de nouveau servir vos clients une fois la réactivation confirmée.",
  revoke:
    "Le routeur sera définitivement retiré de votre organisation et ne pourra plus être modifié. Cette action est irréversible.",
};
/** Lignes de « Gestion du routeur » : titre, conséquence et libellé court du bouton. */
const actionRows: Record<
  RouterAction,
  { title: string; description: string; button: string }
> = {
  provision: {
    title: "Script d’installation",
    description:
      "Ronetz prépare un script propre à ce routeur, à télécharger dès qu’il est prêt.",
    button: "Générer",
  },
  artifact: {
    title: "Nouveau script d’installation",
    description:
      "Remplace le script actuel, qui ne sera plus utilisable. Téléchargeable 15 minutes.",
    button: "Générer",
  },
  suspend: {
    title: "Suspendre le routeur",
    description:
      "Vos clients ne pourront plus acheter d’accès via ce routeur. Réversible.",
    button: "Suspendre",
  },
  resume: {
    title: "Réactiver le routeur",
    description: "Le routeur pourra de nouveau servir vos clients.",
    button: "Réactiver",
  },
  revoke: {
    title: "Révoquer le routeur",
    description:
      "Retire définitivement le routeur de votre organisation. Irréversible.",
    button: "Révoquer",
  },
};
export type RouterActionParts = {
  /** Section « Gestion du routeur » : téléchargement du script et actions techniques. */
  manage: ReactNode;
  /** Ce qu'il reste à faire pour l'étape en cours, affiché sous le stepper de mise en service. */
  guide: ReactNode;
  /** Bandeaux liés aux actions (script expiré, demande sans réponse) et confirmation. */
  notices: ReactNode;
};
/**
 * Actions sur un routeur, découpées pour la page : la section de gestion, le guide et les
 * bandeaux. Un seul état (demande en cours, reçu) les relie.
 */
export function useRouterActions({
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
}): RouterActionParts {
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
  const client = useQueryClient();
  const mutation = useRouterChange(active),
    script = useRouterArtifactDownload(active, router),
    caps = routerCapabilities(active, router, site);
  const expired =
    script.error instanceof ApiError &&
    script.error.status === 410 &&
    !!script.error.problem?.type?.endsWith("/router-artifact-expired");
  // Replaying the pending action is deduplicated; any other command would be refused.
  const replayable =
    !!receipt &&
    (router.pendingAction === null ||
      router.pendingAction === receipt.action.toUpperCase());
  const stage = setupStage(router);
  // The guide carries the download and its expiry while the script is being installed.
  const installing = stage?.step === 2;
  // While preparing, generation is the guide's primary action, not a menu entry.
  const actions = (
    ["provision", "artifact", "suspend", "resume", "revoke"] as const
  ).filter(
    (action) => caps[action] && !(action === "provision" && stage?.step === 1),
  );
  function saveReceipt(value: Receipt | null) {
    setReceipt(value);
    try {
      if (value) sessionStorage.setItem(storageKey, JSON.stringify(value));
      else sessionStorage.removeItem(storageKey);
    } catch {
      /* The current mounted screen still retains the key. */
    }
  }
  async function send(action: RouterAction) {
    const intent = receipt ?? { action, key: crypto.randomUUID() };
    if (intent.action !== action) return;
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
      if (intent.action === "artifact") script.reset();
      onAccepted(intent.action, router);
      notificationManager.add({
        title: "Demande envoyée",
        description: "L’état du routeur se met à jour sur cette page.",
      });
    } catch (error) {
      if (
        error instanceof ApiError &&
        [400, 403, 404, 409, 422].includes(error.status)
      )
        saveReceipt(null); /* Only uncertain results retain the original key. */
    }
  }
  async function confirm() {
    if (selection) await send(selection);
  }
  async function downloadScript() {
    if (!(await script.download())) return;
    notificationManager.add({
      title: "Script téléchargé",
      description:
        "Il contient l’identifiant du routeur : conservez-le en lieu sûr et ne le partagez pas.",
    });
  }
  if (!caps.canCreateRouter)
    return { manage: null, guide: null, notices: null };
  const locked = mutation.pending || !!receipt;
  const download = caps.download && !installing;
  const manage = (download || actions.length > 0) && (
    <SettingsSection
      id="gestion"
      title="Gestion du routeur"
      description="Actions techniques sur l’équipement. Chacune est confirmée avant envoi."
    >
      <SettingsCard>
        {download && (
          <SettingsActionRow
            title="Script d’installation"
            description="Propre à ce routeur et téléchargeable 15 minutes après sa génération. Il contient la clé du routeur : ne le partagez pas."
            action={
              <Button
                variant="outline"
                disabled={script.pending}
                aria-label="Télécharger le script"
                onClick={() => void downloadScript()}
              >
                {script.pending ? "Téléchargement…" : "Télécharger"}
              </Button>
            }
          />
        )}
        {actions.map((action) => (
          <SettingsActionRow
            key={action}
            title={actionRows[action].title}
            description={actionRows[action].description}
            action={
              <Button
                variant={action === "revoke" ? "destructive" : "outline"}
                disabled={locked}
                aria-label={actionLabels[action]}
                onClick={(event) => {
                  trigger.current = event.currentTarget;
                  mutation.reset();
                  setSelection(action);
                }}
              >
                {actionRows[action].button}
              </Button>
            }
          />
        ))}
      </SettingsCard>
    </SettingsSection>
  );
  const guide = stage && (
    <RouterSetupGuide
      router={router}
      stage={stage}
      canGenerate={caps.provision && !receipt}
      canDownload={caps.download}
      canRenew={caps.artifact && !receipt}
      busy={mutation.pending}
      downloading={script.pending}
      expired={expired}
      feedback={
        (mutation.isError && !selection && (
          <RouterFailure error={mutation.error} />
        )) ||
        (installing && !expired && !!script.error && (
          <RouterFailure error={script.error} />
        ))
      }
      onGenerate={() => void send("provision")}
      onDownload={() => void downloadScript()}
      onRenew={() => void send("artifact")}
      onRefresh={() =>
        void client.invalidateQueries({
          queryKey: routerKeys.all(active.organizationId),
        })
      }
    />
  );
  const notices = (
    <>
      {installing ? null : expired ? (
        <Alert variant="destructive">
          <AlertTitle>Script expiré</AlertTitle>
          <AlertDescription>
            Le script n’est téléchargeable que pendant 15 minutes après sa
            génération. Générez-en un nouveau depuis « Gestion du routeur » pour
            continuer.
          </AlertDescription>
        </Alert>
      ) : (
        !!script.error && <RouterFailure error={script.error} />
      )}
      {receipt && !selection && (
        <Alert>
          <AlertTitle>Dernière demande sans réponse</AlertTitle>
          <AlertDescription>
            Le service n’a pas confirmé la réception de votre dernière demande.
            Vous pouvez la renvoyer sans risque de doublon.
            <Button
              variant="outline"
              disabled={mutation.pending || !replayable}
              onClick={() => setSelection(receipt.action)}
            >
              Renvoyer la demande
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
              {selection ? actionLabels[selection] : "Action sur le routeur"} ?
            </AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              Routeur : {router.name}. {selection && explanations[selection]}
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
                  ? "Renvoyer la demande"
                  : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
  return { manage, guide, notices };
}
