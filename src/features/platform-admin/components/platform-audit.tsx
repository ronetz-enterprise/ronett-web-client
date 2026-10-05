import { useSearchParams } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { FilterHorizontalIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/shared/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  DataToolbar,
  type ActiveFilter,
} from "@/shared/components/data-toolbar";
import { Timeline, type TimelineEvent } from "@/shared/components/timeline";
import type { StatusTone } from "@/shared/components/status";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { EmptyState, PageLoading } from "@/shared/components/feedback";
import {
  auditActorLabels,
  auditActorOptions,
  auditResultLabels,
  auditResultOptions,
  auditSeverityLabels,
  auditSeverityOptions,
  auditSourceLabels,
  auditSourceOptions,
  platformCapabilities,
  platformLabel,
  type PlatformSession,
} from "../model/platform";
import { usePlatformAuditEntries } from "../queries/platform";
import {
  PLATFORM_PAGE_SIZE,
  PlatformFailure,
  PlatformForbidden,
  PlatformPageHeader,
  PlatformPagination,
  PlatformSection,
} from "./platform-shared";
import type { AuditEntry } from "../model/platform";

/** Ton d'un événement : l'échec et le refus priment, puis la gravité. */
function auditTone(entry: AuditEntry): StatusTone {
  if (entry.result === "FAILURE") return "danger";
  if (entry.result === "DENIED") return "warning";
  if (["ERROR", "CRITICAL"].includes(entry.severity)) return "danger";
  if (entry.severity === "WARNING") return "warning";
  if (entry.severity === "NOTICE") return "info";
  return "success";
}

export function auditEvents(entries: AuditEntry[]): TimelineEvent[] {
  return entries.map((entry) => ({
    id: entry.id,
    title: entry.action,
    tone: auditTone(entry),
    at: entry.occurredAt,
    description: (
      <span className="flex flex-wrap gap-x-2 gap-y-0.5">
        <span>
          {platformLabel(auditActorLabels, entry.actor.type)}
          {entry.actor.displayNameSnapshot
            ? ` · ${entry.actor.displayNameSnapshot}`
            : ""}
        </span>
        {entry.target.resourceType && (
          <span>
            → {entry.target.displayNameSnapshot ?? entry.target.resourceType}
            {entry.target.resourceId && (
              <span className="ml-1 font-mono text-xs">
                {entry.target.resourceId.slice(0, 8)}
              </span>
            )}
          </span>
        )}
        <span>
          {platformLabel(auditSourceLabels, entry.source)} ·{" "}
          {platformLabel(auditResultLabels, entry.result)} ·{" "}
          {platformLabel(auditSeverityLabels, entry.severity)}
        </span>
        {entry.reason && (
          <span className="w-full italic">« {entry.reason} »</span>
        )}
      </span>
    ),
  }));
}

const ALL = "ALL";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readPage(value: string | null) {
  return /^\d{1,6}$/.test(value ?? "") ? Number(value) : 0;
}

function readChoice(
  value: string | null,
  allowed: readonly string[],
  fallback: string,
) {
  return value && allowed.includes(value) ? value : fallback;
}

/** Une date locale est convertie en instant UTC, que le backend sait lire. */
function toInstant(local: string) {
  if (!local) return "";
  const parsed = new Date(local);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function toLocalDate(value: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toISOString().slice(0, 10);
}

/**
 * Journal d'audit plateforme.
 *
 * Les filtres sont ceux du backend : organisation, auteur, résultat, gravité,
 * source et période. Un journal en écriture seule ne propose ni tri ni
 * modification.
 */
export function PlatformAudit({ session }: { session: PlatformSession }) {
  const capabilities = platformCapabilities(session);
  const [params, setParams] = useSearchParams();

  const page = readPage(params.get("page"));
  const organizationId = UUID.test(params.get("organisation") ?? "")
    ? params.get("organisation")
    : null;
  const actorType = readChoice(
    params.get("auteur"),
    [ALL, ...auditActorOptions],
    ALL,
  );
  const result = readChoice(
    params.get("resultat"),
    [ALL, ...auditResultOptions],
    ALL,
  );
  const severity = readChoice(
    params.get("gravite"),
    [ALL, ...auditSeverityOptions],
    ALL,
  );
  const source = readChoice(
    params.get("source"),
    [ALL, ...auditSourceOptions],
    ALL,
  );
  const from = toLocalDate(params.get("du"));
  const to = toLocalDate(params.get("au"));

  const entries = usePlatformAuditEntries(
    capabilities.canReadAudit ? session : undefined,
    {
      organizationId,
      actorType,
      result,
      severity,
      source,
      from: toInstant(from),
      to: toInstant(to),
    },
    page,
    PLATFORM_PAGE_SIZE,
  );

  function update(next: Record<string, string | null>) {
    const search = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value) search.set(key, value);
      else search.delete(key);
    }
    search.delete("page");
    setParams(search, { replace: true, preventScrollReset: true });
  }

  function goToPage(next: number) {
    const search = new URLSearchParams(params);
    search.set("page", String(next));
    setParams(search, { preventScrollReset: true });
  }

  if (!capabilities.canReadAudit)
    return (
      <div className="space-y-6">
        <PlatformPageHeader
          title="Journal d'audit"
          description="Événements journalisés, en écriture seule."
        />
        <PlatformForbidden area="Le journal d'audit" />
      </div>
    );

  const chip = (key: string, label: string, param: string): ActiveFilter => ({
    key,
    label,
    onRemove: () => update({ [param]: null }),
  });
  const chips = [
    actorType !== ALL &&
      chip(
        "actor",
        `Auteur : ${platformLabel(auditActorLabels, actorType)}`,
        "auteur",
      ),
    result !== ALL &&
      chip(
        "result",
        `Résultat : ${platformLabel(auditResultLabels, result)}`,
        "resultat",
      ),
    severity !== ALL &&
      chip(
        "severity",
        `Gravité : ${platformLabel(auditSeverityLabels, severity)}`,
        "gravite",
      ),
    source !== ALL &&
      chip(
        "source",
        `Source : ${platformLabel(auditSourceLabels, source)}`,
        "source",
      ),
    from && chip("from", `Depuis le ${from}`, "du"),
    to && chip("to", `Jusqu’au ${to}`, "au"),
  ].filter((value): value is ActiveFilter => !!value);
  function clear() {
    update({
      organisation: null,
      auteur: null,
      resultat: null,
      gravite: null,
      source: null,
      du: null,
      au: null,
    });
  }

  return (
    <div className="space-y-8">
      <PlatformPageHeader
        title="Journal d'audit"
        description="Événements journalisés par les modules, en écriture seule."
      />

      <DataToolbar
        search={params.get("organisation") ?? ""}
        onSearch={(value) => update({ organisation: value || null })}
        searchLabel="Identifiant d’organisation"
        active={chips}
        onClear={clear}
        count={entries.data?.totalElements}
        countLabel="événement"
        filters={
          <Popover>
            <PopoverTrigger
              render={<Button variant="outline" size="sm" className="h-8" />}
            >
              <HugeiconsIcon
                icon={FilterHorizontalIcon}
                strokeWidth={1.75}
                data-icon="inline-start"
              />
              Filtre
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80 space-y-3">
              <FilterSelect
                id="platform-audit-actor"
                label="Auteur"
                value={actorType}
                options={[ALL, ...auditActorOptions]}
                labels={{ [ALL]: "Tous", ...auditActorLabels }}
                onChange={(value) => update({ auteur: value ?? null })}
              />
              <FilterSelect
                id="platform-audit-result"
                label="Résultat"
                value={result}
                options={[ALL, ...auditResultOptions]}
                labels={{ [ALL]: "Tous", ...auditResultLabels }}
                onChange={(value) => update({ resultat: value ?? null })}
              />
              <FilterSelect
                id="platform-audit-severity"
                label="Gravité"
                value={severity}
                options={[ALL, ...auditSeverityOptions]}
                labels={{ [ALL]: "Toutes", ...auditSeverityLabels }}
                onChange={(value) => update({ gravite: value ?? null })}
              />
              <FilterSelect
                id="platform-audit-source"
                label="Source"
                value={source}
                options={[ALL, ...auditSourceOptions]}
                labels={{ [ALL]: "Toutes", ...auditSourceLabels }}
                onChange={(value) => update({ source: value ?? null })}
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="platform-audit-from"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Depuis
                  </label>
                  <Input
                    id="platform-audit-from"
                    type="date"
                    value={from}
                    onChange={(event) =>
                      update({ du: event.target.value || null })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="platform-audit-to"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Jusqu’au
                  </label>
                  <Input
                    id="platform-audit-to"
                    type="date"
                    value={to}
                    onChange={(event) =>
                      update({ au: event.target.value || null })
                    }
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        }
      />
      {params.get("organisation") && !organizationId && (
        <p className="text-xs text-muted-foreground">
          Saisissez l’identifiant complet de l’organisation pour filtrer.
        </p>
      )}

      <PlatformSection
        title="Événements"
        description="Ordre antéchronologique, figé à l'écriture."
      >
        {entries.isPending ? (
          <PageLoading />
        ) : entries.isError || !entries.data ? (
          <PlatformFailure
            error={entries.error}
            retry={() => void entries.refetch()}
          />
        ) : entries.data.content.length === 0 ? (
          <EmptyState
            objectType="organization"
            variant={chips.length || organizationId ? "filtered" : "empty"}
            title="Aucun événement"
            description="Aucun événement ne correspond à ces filtres."
          />
        ) : (
          <div className="space-y-4">
            <Timeline events={auditEvents(entries.data.content)} />
            <PlatformPagination
              page={entries.data.page}
              totalElements={entries.data.totalElements}
              totalPages={entries.data.totalPages}
              onChange={goToPage}
              label="événements"
            />
          </div>
        )}
      </PlatformSection>
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  options,
  labels,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  labels: Record<string, string>;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {labels[option] ?? option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
