import { useEffect, useState } from "react";
import { Link } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare02Icon } from "@hugeicons/core-free-icons";
import {
  ReadOnlyValue,
  SettingField,
  SettingsSection,
} from "@/shared/components/settings-layout";
import { Button } from "@/shared/ui/button";
import { siteRoutes, type Site } from "../model/site";

/**
 * Section « Portail client » : le QR code à afficher sur place et le lien copiable du portail
 * d'achat. L'adresse dépend de l'origine du navigateur : elle n'est calculée qu'après hydratation.
 */
export function SitePortalSection({ site }: { site: Site }) {
  const [origin, setOrigin] = useState<string>();
  useEffect(() => setOrigin(window.location.origin), []);
  const url = origin ? origin + siteRoutes.portal(site.id) : undefined;
  return (
    <SettingsSection
      id="portail"
      title="Portail client"
      description={
        site.status === "ACTIVE"
          ? "Affichez le QR code sur place ou partagez le lien : vos clients y achètent un accès."
          : "Le portail ne propose aucun achat tant que le site n’est pas actif."
      }
    >
      {url && (
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="w-fit shrink-0 rounded-lg border bg-background p-3">
            {/* Le QR code reste noir sur blanc pour rester lisible par tous les lecteurs. */}
            <QRCodeSVG
              value={url}
              size={128}
              marginSize={1}
              title={`QR code du portail de ${site.name}`}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <SettingField label="Lien du portail">
              <ReadOnlyValue
                mono
                copy={{ value: url, label: "le lien du portail" }}
              >
                {url}
              </ReadOnlyValue>
            </SettingField>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link
                  to={siteRoutes.portal(site.id)}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              <HugeiconsIcon
                icon={LinkSquare02Icon}
                strokeWidth={1.75}
                data-icon="inline-start"
              />
              Ouvrir le portail
              <span className="sr-only"> (nouvel onglet)</span>
            </Button>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}
