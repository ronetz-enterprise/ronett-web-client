import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { CopyableId } from "@/shared/components/copyable-id";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { cn } from "@/shared/utils/cn";
import {
  artifactFileName,
  routerOsMinimum,
  setupSteps,
  type Router,
  type SetupStage,
} from "../model/router";

/** Fil des quatre étapes de mise en service ; `current` part de 0 (Identifier). */
export function RouterSetupSteps({ current }: { current: number }) {
  return (
    <ol
      aria-label="Étapes de mise en service"
      className="grid grid-cols-4 gap-2"
    >
      {setupSteps.map((label, index) => {
        const done = index < current,
          now = index === current;
        return (
          <li
            key={label}
            aria-current={now ? "step" : undefined}
            className="min-w-0 space-y-1.5"
          >
            <div
              aria-hidden="true"
              className={cn(
                "h-1 rounded-full",
                done || now ? "bg-primary" : "bg-muted",
              )}
            />
            <p
              className={cn(
                "flex items-center gap-1 truncate text-xs",
                now ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {done && (
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  strokeWidth={1.75}
                  className="size-3.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
              )}
              <span className="truncate">
                {index + 1}. {label}
              </span>
              <span className="sr-only">
                {done ? " (terminée)" : now ? " (en cours)" : " (à venir)"}
              </span>
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function Instruction({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums"
      >
        {index}
      </span>
      <div className="min-w-0 flex-1 space-y-2 pt-0.5">{children}</div>
    </li>
  );
}

/**
 * Ce qu'il reste à faire pour l'étape en cours de la mise en service : une seule action
 * principale à la fois, dans le vocabulaire du gérant de site.
 */
export function RouterSetupGuide({
  router,
  stage,
  canGenerate,
  canDownload,
  canRenew,
  busy,
  downloading,
  expired,
  feedback,
  onGenerate,
  onDownload,
  onRenew,
  onRefresh,
}: {
  router: Router;
  stage: SetupStage;
  canGenerate: boolean;
  canDownload: boolean;
  canRenew: boolean;
  busy: boolean;
  downloading: boolean;
  expired: boolean;
  /** Erreur d'une action lancée depuis cette carte. */
  feedback?: ReactNode;
  onGenerate: () => void;
  onDownload: () => void;
  onRenew: () => void;
  onRefresh: () => void;
}) {
  const fileName = artifactFileName(router);
  const refresh = (
    <Button variant="outline" onClick={onRefresh}>
      Vérifier maintenant
    </Button>
  );
  let title: string, body: ReactNode;
  if (stage.step === 1 && stage.state === "running") {
    title = "Préparation du script d’installation…";
    body = (
      <>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Spinner aria-hidden="true" role={undefined} />
          Cette page se met à jour dès que le script est prêt.
        </p>
        <div>{refresh}</div>
      </>
    );
  } else if (stage.step === 1) {
    const failed = stage.state === "failed";
    title = failed
      ? "La préparation du script a échoué"
      : "Préparez le script d’installation";
    body = (
      <>
        <p className="text-muted-foreground">
          {failed
            ? "Vous pouvez réessayer. Si l’échec persiste, contactez le support."
            : `Ronetz génère un script propre à ce routeur. Vous le copierez ensuite sur votre ${router.vendor} ${router.model}.`}
        </p>
        {canGenerate ? (
          <div>
            <Button disabled={busy} onClick={onGenerate}>
              {busy
                ? "Envoi…"
                : failed
                  ? "Réessayer"
                  : "Générer le script d’installation"}
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground">
            Le site de ce routeur doit être actif pour continuer.
          </p>
        )}
      </>
    );
  } else if (stage.step === 2) {
    title = "Installez le script sur votre routeur";
    body = (
      <>
        <ol className="space-y-4">
          <Instruction index={1}>
            <p>
              Téléchargez le script. Il reste disponible 15 minutes après sa
              génération et ne doit pas être partagé.
            </p>
            {expired ? (
              <div className="space-y-2">
                <p className="text-danger-foreground">
                  Le script a expiré : générez-en un nouveau.
                </p>
                {canRenew && (
                  <Button disabled={busy} onClick={onRenew}>
                    {busy ? "Envoi…" : "Générer un nouveau script"}
                  </Button>
                )}
              </div>
            ) : (
              canDownload && (
                <Button disabled={downloading} onClick={onDownload}>
                  {downloading ? "Téléchargement…" : "Télécharger le script"}
                </Button>
              )
            )}
          </Instruction>
          <Instruction index={2}>
            <p>
              Ouvrez Winbox ou WebFig, connectez-vous au routeur et déposez le
              fichier <code className="font-mono text-xs">{fileName}</code> dans
              le menu <strong className="font-medium">Files</strong>.
            </p>
          </Instruction>
          <Instruction index={3}>
            <p>
              Ouvrez <strong className="font-medium">New Terminal</strong> et
              lancez :
            </p>
            <CopyableId
              className="rounded-md border bg-muted/40 px-2 py-1"
              value={`/import file-name=${fileName}`}
              label="commande d’import"
            />
          </Instruction>
          <Instruction index={4}>
            <p>
              Revenez ici : l’étape suivante s’affiche dès que le routeur se
              signale à Ronetz.
            </p>
            <div>{refresh}</div>
          </Instruction>
        </ol>
        <p className="text-xs text-muted-foreground">
          RouterOS {routerOsMinimum} ou plus récent requis.
        </p>
      </>
    );
  } else {
    title = "En attente du premier signal du routeur";
    body = (
      <>
        <p className="text-muted-foreground">
          Le routeur est enregistré. Vérifiez qu’il est sous tension et relié à
          Internet : il apparaîtra en ligne dès son premier signal.
        </p>
        <div>{refresh}</div>
      </>
    );
  }
  // Encadré « à faire » placé sous l'étape en cours du stepper de mise en service.
  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 text-sm">
      <h3 className="font-heading text-base font-semibold">{title}</h3>
      {body}
      {feedback}
    </div>
  );
}
