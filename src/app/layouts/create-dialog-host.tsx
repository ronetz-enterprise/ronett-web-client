import { FieldHeader } from "@/shared/components/field-header";
import { useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import type { Membership } from "@/features/memberships";
import { ManualAccessForm } from "@/features/access";
import { OfferCreate, type CreateValues } from "@/features/offer";
import { RouterCreate } from "@/features/router";
import { SiteCreate, useSites } from "@/features/site";
import { FormDialogContent } from "@/shared/components/form-dialog";
import { PageLoading } from "@/shared/components/feedback";
import { Dialog } from "@/shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

export type CreateKind = "site" | "router" | "offer" | "access";

const titles: Record<CreateKind, [string, string]> = {
  site: ["Créer un site", "Le lieu où votre WiFi est proposé."],
  router: [
    "Ajouter un routeur",
    "Étape 1 sur 3 : indiquez où le routeur sera installé et de quel équipement il s’agit.",
  ],
  offer: [
    "Créer une offre",
    "Un brouillon, à vérifier puis publier sur le portail du site.",
  ],
  access: [
    "Créer un accès",
    "Sans passer par le portail. L’identifiant et le mot de passe s’affichent juste après la création.",
  ],
};

/**
 * Modale de création, ouverte par-dessus la page courante via `?create=<type>` (et `siteId` /
 * `site` pour présélectionner un site). Fermer retire ces paramètres et laisse la page intacte.
 */
export function CreateDialogHost({ active }: { active: Membership }) {
  const [params, setParams] = useSearchParams();
  const raw = params.get("create");
  const kind = raw && raw in titles ? (raw as CreateKind) : null;
  const siteId = params.get("siteId") ?? params.get("site") ?? undefined;
  function close() {
    const next = new URLSearchParams(params);
    next.delete("create");
    next.delete("siteId");
    setParams(next, { replace: true });
  }
  if (!kind) return null;
  const [title, description] = titles[kind];
  const org = active.organizationId;
  let body: ReactNode;
  if (kind === "site") body = <SiteCreate active={active} />;
  else if (kind === "router")
    body = <RouterCreate key={siteId} active={active} siteId={siteId} />;
  else if (kind === "access") body = <ManualAccessForm active={active} />;
  else body = <OfferCreateChooser active={active} siteId={siteId} />;
  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <FormDialogContent
        title={title}
        description={description}
        onClose={close}
      >
        <div key={`${org}/${kind}`}>{body}</div>
      </FormDialogContent>
    </Dialog>
  );
}

/**
 * Une offre appartient à un site : il est le premier champ du formulaire, présélectionné
 * (site de la page, sinon le premier site actif). Changer de site garde la saisie.
 */
function OfferCreateChooser({
  active,
  siteId,
}: {
  active: Membership;
  siteId?: string;
}) {
  const sites = useSites(active);
  const [chosen, setChosen] = useState(siteId ?? "");
  const draft = useRef<Partial<CreateValues>>({});
  if (sites.isPending) return <PageLoading variant="form" />;
  const choices = (sites.data ?? []).filter((site) => site.status === "ACTIVE");
  const selected =
    choices.find((site) => site.id === chosen) ??
    (siteId ? undefined : choices[0]);
  const target = selected?.id ?? siteId;
  if (!target)
    return (
      <p className="text-sm text-muted-foreground">
        Aucun site actif : créez ou réactivez un site pour y vendre une offre.
      </p>
    );
  const siteField = (
    <div className="space-y-2">
      <FieldHeader
        htmlFor="create-offer-site"
        label="Site"
        description="Le lieu où l’offre sera vendue, sur le portail WiFi."
      />
      <Select
        value={target}
        onValueChange={(value) => value && setChosen(value)}
      >
        <SelectTrigger id="create-offer-site" className="w-full">
          <SelectValue>{() => selected?.name ?? "Choisir un site"}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {choices.map((site) => (
            <SelectItem key={site.id} value={site.id}>
              {site.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  return (
    <OfferCreate
      key={target}
      active={active}
      siteId={target}
      siteField={siteField}
      draft={draft}
    />
  );
}
