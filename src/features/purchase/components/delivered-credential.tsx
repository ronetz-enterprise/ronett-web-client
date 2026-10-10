import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  Tick02Icon,
  ViewIcon,
  ViewOffSlashIcon,
  Wifi01Icon,
} from "@hugeicons/core-free-icons";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { formatDateTime } from "@/shared/utils/format";
import type { DeliveredCredential } from "../api/purchase-api";

function CopyField({
  label,
  value,
  hidden = false,
  onToggle,
}: {
  label: string;
  value: string;
  hidden?: boolean;
  onToggle?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
        <code
          className="min-w-0 flex-1 font-mono text-sm break-all select-all"
          aria-label={hidden ? `${label} masqué` : label}
        >
          {hidden ? "•".repeat(16) : value}
        </code>
        {onToggle && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-pressed={!hidden}
            aria-label={
              hidden
                ? `Afficher le ${label.toLowerCase()}`
                : `Masquer le ${label.toLowerCase()}`
            }
            onClick={onToggle}
          >
            <HugeiconsIcon
              icon={hidden ? ViewIcon : ViewOffSlashIcon}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => void copy()}
          aria-label={`Copier le ${label.toLowerCase()}`}
        >
          <HugeiconsIcon
            icon={copied ? Tick02Icon : Copy01Icon}
            strokeWidth={1.75}
            data-icon="inline-start"
            aria-hidden="true"
          />
          {copied ? "Copié" : "Copier"}
        </Button>
      </div>
      <span role="status" className="sr-only">
        {copied ? `${label} copié` : ""}
      </span>
    </div>
  );
}

/**
 * Identifiants remis à l'acheteur : gardés seulement en mémoire, jamais dans le stockage du
 * navigateur. Ils sont longs (générés au hasard) : la copie en un geste est l'usage prévu.
 */
export function DeliveredCredentialCard({
  credential,
  hotspotLogin,
}: {
  credential: DeliveredCredential;
  hotspotLogin: string | null;
}) {
  const [hidden, setHidden] = useState(false);
  return (
    <div className="space-y-6">
      <section
        aria-label="Vos identifiants"
        className="space-y-4 rounded-xl border bg-card p-4 sm:p-5"
      >
        <div>
          <h2 className="text-base font-semibold">
            Vos identifiants de connexion
          </h2>
          <p className="text-sm text-muted-foreground">
            Valables jusqu’au {formatDateTime(credential.expiresAt)}.
          </p>
        </div>
        <CopyField label="Identifiant" value={credential.username} />
        <CopyField
          label="Mot de passe"
          value={credential.clearTextPassword}
          hidden={hidden}
          onToggle={() => setHidden((value) => !value)}
        />
        <Alert variant="warning">
          <AlertDescription>
            Notez-les ou faites une capture d’écran : ils ne seront plus
            affichés dans quelques minutes.
          </AlertDescription>
        </Alert>
      </section>

      <section aria-label="Se connecter" className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Se connecter au WiFi
        </h2>
        <ol className="space-y-3 text-sm">
          {[
            "Revenez à la page de connexion du WiFi.",
            "Collez l’identifiant, puis le mot de passe.",
            "Appuyez sur « Se connecter » : Internet est disponible.",
          ].map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        {hotspotLogin && (
          <Button
            nativeButton={false}
            className="min-h-11 w-full"
            render={
              <a
                href={hotspotLogin}
                aria-label="Revenir à la page de connexion du WiFi"
              />
            }
          >
            <HugeiconsIcon
              icon={Wifi01Icon}
              strokeWidth={1.75}
              data-icon="inline-start"
              aria-hidden="true"
            />
            Revenir à la page de connexion
          </Button>
        )}
      </section>
    </div>
  );
}
