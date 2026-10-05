import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/input-group";
import { formatNumber } from "@/shared/utils/format";

export type ActiveFilter = { key: string; label: string; onRemove: () => void };

/**
 * Barre d'outils de liste : recherche, déclencheur de filtres (souvent un `Popover`), puces des
 * filtres actifs et compteur annoncé aux lecteurs d'écran.
 */
export function DataToolbar({
  search,
  onSearch,
  searchLabel = "Rechercher",
  filters,
  active = [],
  onClear,
  count,
  countLabel = "résultat",
  countPlural,
  actions,
}: {
  search?: string;
  onSearch?: (value: string) => void;
  searchLabel?: string;
  /** Contrôle d'ajout de filtre, par exemple `<Popover>` avec un bouton « + Filtre ». */
  filters?: ReactNode;
  active?: ActiveFilter[];
  onClear?: () => void;
  count?: number;
  countLabel?: string;
  /** Pluriel irrégulier du compteur (« accès ») ; par défaut `countLabel` + « s ». */
  countPlural?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {onSearch && (
        <InputGroup className="h-9 w-full sm:w-72">
          <InputGroupAddon>
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label={searchLabel}
            placeholder={`${searchLabel}…`}
            value={search ?? ""}
            onChange={(event) => onSearch(event.target.value)}
          />
        </InputGroup>
      )}
      {filters}
      {active.map((filter) => (
        <Badge
          key={filter.key}
          variant="outline"
          className="h-8 gap-1 pr-1 pl-3 text-sm font-normal"
        >
          {filter.label}
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Retirer le filtre ${filter.label}`}
            onClick={filter.onRemove}
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </Button>
        </Badge>
      ))}
      {active.length > 1 && onClear && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Tout effacer
        </Button>
      )}
      {count !== undefined && (
        <p role="status" className="text-sm text-muted-foreground">
          {formatNumber(count)}{" "}
          {count > 1 ? (countPlural ?? `${countLabel}s`) : countLabel}
        </p>
      )}
      {actions && (
        <div className="flex items-center gap-2 sm:ml-auto">{actions}</div>
      )}
    </div>
  );
}
