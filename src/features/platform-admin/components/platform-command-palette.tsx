import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Analytics01Icon,
  Building03Icon,
  RouterIcon,
  Search01Icon,
  ShieldCheckIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { IconTile } from "@/shared/components/icon-tile";
import type { ObjectType } from "@/shared/components/object-icons";
import { Button } from "@/shared/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/shared/ui/command";
import { Kbd, KbdGroup } from "@/shared/ui/kbd";
import { toUserMessage } from "@/shared/errors/api-error";
import {
  platformCapabilities,
  platformLabel,
  platformRoutes,
  searchableQuery,
  searchResourceLabels,
  type PlatformSession,
  type SearchResult,
} from "../model/platform";
import { usePlatformSearch } from "../queries/platform";

const resourceIcons: Record<string, ObjectType> = {
  ORGANIZATION: "organization",
  IDENTITY: "member",
  ROUTER: "router",
  PAYMENT: "sale",
  ACCESS: "access",
};

/** Délai de frappe avant d'interroger le serveur. */
function useDebounced(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * Palette `Ctrl K` de l'administration : navigation entre les écrans et recherche globale.
 * La recherche serveur est exacte (identifiant complet ou email) ; la palette l'annonce.
 */
export function PlatformCommandPalette({
  session,
}: {
  session: PlatformSession;
}) {
  const navigate = useNavigate();
  const capabilities = platformCapabilities(session);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const searchable = searchableQuery(useDebounced(text));
  const search = usePlatformSearch(session, open ? searchable : null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function close() {
    setOpen(false);
    setText("");
    setCopied(null);
  }
  function go(to: string) {
    close();
    void navigate(to);
  }
  async function select(result: SearchResult) {
    if (result.resourceType === "ORGANIZATION")
      return go(platformRoutes.organization(result.resourceId));
    if (result.resourceType === "ROUTER" && result.organizationId)
      return go(platformRoutes.organization(result.organizationId));
    // Sans écran dédié, l'identifiant est copié pour être utilisé ailleurs.
    try {
      await navigator.clipboard.writeText(result.resourceId);
      setCopied(result.resourceId);
    } catch {
      setCopied(null);
    }
  }

  const needle = text.trim().toLocaleLowerCase("fr");
  const pages = [
    {
      label: "Vue d’ensemble",
      to: platformRoutes.dashboard,
      icon: Analytics01Icon,
      visible: capabilities.canViewPlatform,
    },
    {
      label: "Organisations",
      to: platformRoutes.organizations,
      icon: Building03Icon,
      visible: capabilities.canReadOrganizations,
    },
    {
      label: "Réseau",
      to: platformRoutes.network,
      icon: RouterIcon,
      visible: capabilities.canReadNetwork,
    },
    {
      label: "Opérations financières",
      to: platformRoutes.finance,
      icon: Wallet01Icon,
      visible: capabilities.canViewPlatform,
    },
    {
      label: "Journal d’audit",
      to: platformRoutes.audit,
      icon: ShieldCheckIcon,
      visible: capabilities.canReadAudit,
    },
  ].filter(
    (page) =>
      page.visible &&
      (!needle || page.label.toLocaleLowerCase("fr").includes(needle)),
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="fixed right-4 bottom-4 z-40 gap-2 shadow-sm"
        onClick={() => setOpen(true)}
      >
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={1.75}
          data-icon="inline-start"
        />
        Rechercher
        <KbdGroup className="hidden sm:inline-flex">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={(value) => (value ? setOpen(true) : close())}
        title="Recherche plateforme"
        description="Aller à un écran ou retrouver une organisation, un utilisateur, un routeur, un paiement ou un accès."
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={text}
            onValueChange={(value) => {
              setText(value);
              setCopied(null);
            }}
            placeholder="Écran, identifiant complet ou email…"
          />
          <CommandList>
            {pages.length > 0 && (
              <CommandGroup heading="Aller à">
                {pages.map((page) => (
                  <CommandItem
                    key={page.to}
                    value={page.to}
                    onSelect={() => go(page.to)}
                  >
                    <HugeiconsIcon icon={page.icon} strokeWidth={1.75} />
                    {page.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {searchable && (
              <CommandGroup heading="Résultats">
                {search.isFetching && (
                  <p
                    role="status"
                    className="px-2 py-3 text-xs text-muted-foreground"
                  >
                    Recherche…
                  </p>
                )}
                {search.isError && (
                  <p
                    role="alert"
                    className="px-2 py-3 text-xs text-destructive"
                  >
                    {toUserMessage(search.error)}
                  </p>
                )}
                {search.data?.map((result) => (
                  <CommandItem
                    key={`${result.resourceType}/${result.resourceId}`}
                    value={`${result.resourceType}/${result.resourceId}`}
                    onSelect={() => void select(result)}
                  >
                    <IconTile
                      type={
                        resourceIcons[result.resourceType] ?? "organization"
                      }
                      size="sm"
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {result.displayReference}
                    </span>
                    <CommandShortcut>
                      {copied === result.resourceId
                        ? "Copié"
                        : platformLabel(
                            searchResourceLabels,
                            result.resourceType,
                          )}
                    </CommandShortcut>
                  </CommandItem>
                ))}
                {search.isSuccess && search.data.length === 0 && (
                  <p className="px-2 py-3 text-xs text-muted-foreground">
                    Aucune correspondance exacte.
                  </p>
                )}
              </CommandGroup>
            )}
            {!searchable && text.trim() && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                La recherche porte sur un identifiant complet ou une adresse
                email.
              </p>
            )}
            <CommandEmpty>Aucun écran ne correspond.</CommandEmpty>
          </CommandList>
          <span role="status" className="sr-only">
            {copied ? "Identifiant copié" : ""}
          </span>
        </Command>
      </CommandDialog>
    </>
  );
}
