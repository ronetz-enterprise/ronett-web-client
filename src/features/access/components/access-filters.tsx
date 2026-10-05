import { useId } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { FilterHorizontalIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  DataToolbar,
  type ActiveFilter,
} from "@/shared/components/data-toolbar";
import type { Site } from "@/features/site";
import {
  accessGrantStatusLabels,
  projectionStatusLabels,
  accessSourceLabels,
} from "../model/access-grant";

/**
 * Filtres de la liste. Le backend n'accepte que `page` et `size` : seul le site est transmis
 * en requête ; les autres critères portent sur la page affichée (la liste le signale).
 */
export type AccessFilters = {
  siteId: string | null;
  status: string;
  source: string;
  projection: string;
  period: "all" | "overdue" | "soon";
  search: string;
};

export const emptyAccessFilters: AccessFilters = {
  siteId: null,
  status: "ALL",
  source: "ALL",
  projection: "ALL",
  period: "all",
  search: "",
};

export function countActiveFilters(filters: AccessFilters) {
  return [
    filters.siteId,
    filters.status !== "ALL",
    filters.source !== "ALL",
    filters.projection !== "ALL",
    filters.period !== "all",
    filters.search.trim() !== "",
  ].filter(Boolean).length;
}

/**
 * Base-ui n'affiche que la valeur brute : chaque sélecteur fournit donc son
 * propre libellé, y compris pour l'option « Tous ».
 */
function labelOf(options: Record<string, string>, value: string | null) {
  if (!value || value === "ALL") return "Tous";
  return options[value] ?? value;
}

const periodLabels: Record<string, string> = {
  all: "Toutes",
  overdue: "Déjà expirés",
  soon: "Expirent dans les 48 h",
};

function FilterFields({
  filters,
  onChange,
  sites,
  idPrefix,
}: {
  filters: AccessFilters;
  onChange: (next: AccessFilters) => void;
  sites: Site[];
  idPrefix: string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor={`${idPrefix}-site`} className="text-sm font-medium">
          Site
        </label>
        <Select
          value={filters.siteId ?? "ALL"}
          onValueChange={(value) =>
            onChange({
              ...filters,
              siteId: !value || value === "ALL" ? null : value,
            })
          }
        >
          <SelectTrigger id={`${idPrefix}-site`} className="w-full">
            <SelectValue placeholder="Tous les sites">
              {() => {
                const site = sites.find(
                  (candidate) => candidate.id === filters.siteId,
                );
                return site ? site.name : "Tous les sites";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les sites</SelectItem>
            {sites.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.name}
                {site.status !== "ACTIVE" ? " · Inactif" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Criterion
        id={`${idPrefix}-status`}
        label="État de l’accès"
        value={filters.status}
        options={accessGrantStatusLabels}
        onChange={(value) => onChange({ ...filters, status: value })}
      />
      <Criterion
        id={`${idPrefix}-source`}
        label="Origine"
        value={filters.source}
        options={accessSourceLabels}
        onChange={(value) => onChange({ ...filters, source: value })}
      />
      <Criterion
        id={`${idPrefix}-projection`}
        label="Sur le réseau"
        value={filters.projection}
        options={projectionStatusLabels}
        onChange={(value) => onChange({ ...filters, projection: value })}
      />

      <div className="space-y-2">
        <label htmlFor={`${idPrefix}-period`} className="text-sm font-medium">
          Expiration
        </label>
        <Select
          value={filters.period}
          onValueChange={(value) =>
            onChange({
              ...filters,
              period: value as AccessFilters["period"],
            })
          }
        >
          <SelectTrigger id={`${idPrefix}-period`} className="w-full">
            <SelectValue>
              {() => labelOf(periodLabels, filters.period)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="overdue">Déjà expirés</SelectItem>
            <SelectItem value="soon">Expirent dans les 48 h</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function Criterion({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Select value={value} onValueChange={(next) => onChange(next ?? "ALL")}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue>{() => labelOf(options, value)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tous</SelectItem>
          {Object.entries(options).map(([key, text]) => (
            <SelectItem key={key} value={key}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function AccessFilterControls({
  filters,
  onChange,
  sites,
  count,
}: {
  filters: AccessFilters;
  onChange: (next: AccessFilters) => void;
  sites: Site[];
  /** Nombre d'accès affichés après filtrage. */
  count?: number;
}) {
  const id = useId();
  const site = sites.find((candidate) => candidate.id === filters.siteId);
  const chips: ActiveFilter[] = [
    filters.siteId && {
      key: "site",
      label: `Site : ${site?.name ?? "inconnu"}`,
      onRemove: () => onChange({ ...filters, siteId: null }),
    },
    filters.status !== "ALL" && {
      key: "status",
      label: `État : ${labelOf(accessGrantStatusLabels, filters.status)}`,
      onRemove: () => onChange({ ...filters, status: "ALL" }),
    },
    filters.source !== "ALL" && {
      key: "source",
      label: `Origine : ${labelOf(accessSourceLabels, filters.source)}`,
      onRemove: () => onChange({ ...filters, source: "ALL" }),
    },
    filters.projection !== "ALL" && {
      key: "projection",
      label: `Réseau : ${labelOf(projectionStatusLabels, filters.projection)}`,
      onRemove: () => onChange({ ...filters, projection: "ALL" }),
    },
    filters.period !== "all" && {
      key: "period",
      label: labelOf(periodLabels, filters.period),
      onRemove: () => onChange({ ...filters, period: "all" }),
    },
  ].filter((chip): chip is ActiveFilter => !!chip);
  return (
    <DataToolbar
      search={filters.search}
      onSearch={(search) => onChange({ ...filters, search })}
      searchLabel="Rechercher un identifiant"
      active={chips}
      onClear={() => onChange(emptyAccessFilters)}
      count={count}
      countLabel="accès"
      countPlural="accès"
      filters={
        <Popover>
          <PopoverTrigger
            render={<Button variant="outline" size="sm" className="h-8" />}
          >
            <HugeiconsIcon
              icon={FilterHorizontalIcon}
              data-icon="inline-start"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            Filtre
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="max-h-[70vh] w-80 overflow-y-auto"
          >
            <FilterFields
              filters={filters}
              onChange={onChange}
              sites={sites}
              idPrefix={id}
            />
          </PopoverContent>
        </Popover>
      }
    />
  );
}
