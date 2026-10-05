import {
  ReadOnlyValue,
  SettingField,
} from "@/shared/components/settings-layout";
import { credentialExposure } from "../delivery/public-delivery";
import type { AccessGrant } from "../model/access-grant";

/**
 * Identifiant de connexion du client. Il n'est pas secret et reste copiable ; le mot de passe
 * n'est jamais affiché ici : le service ne le donne qu'une fois, à la création de l'accès.
 */
export function AccessCredentialPanel({ grant }: { grant: AccessGrant }) {
  return (
    <div className="space-y-4">
      {credentialExposure(grant).kind === "credential-issued" &&
      grant.username ? (
        <SettingField
          label="Identifiant de connexion"
          description="Le client le saisit sur la page de connexion WiFi du site."
        >
          <ReadOnlyValue
            mono
            copy={{
              value: grant.username,
              label: "l’identifiant de connexion",
            }}
          >
            {grant.username}
          </ReadOnlyValue>
        </SettingField>
      ) : (
        <p className="text-sm text-muted-foreground">
          L’identifiant de connexion n’est pas encore prêt.
        </p>
      )}
      <p className="max-w-xl text-sm text-muted-foreground">
        Le mot de passe n’est affiché qu’une seule fois, au moment où l’accès
        est créé. Il ne peut plus être consulté ensuite, ni par vous ni par
        votre équipe.
      </p>
    </div>
  );
}
