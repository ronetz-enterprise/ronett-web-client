import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { AmountExample } from "./expressive-amount";
import { CopyableId } from "@/shared/components/copyable-id";
import { DataToolbar } from "@/shared/components/data-toolbar";
import { EmptyState } from "@/shared/components/feedback";
import { IconTile } from "@/shared/components/icon-tile";
import { KeyValueList } from "@/shared/components/key-value-list";
import { Meter } from "@/shared/components/meter";
import { objectIcons, type ObjectType } from "@/shared/components/object-icons";
import { PageSection } from "@/shared/components/page-patterns";
import { StatTile } from "@/shared/components/stat-tile";
import { StatusDot } from "@/shared/components/status-dot";
import { SuccessMoment } from "@/shared/components/success-moment";
import { Timeline } from "@/shared/components/timeline";
import { Button } from "@/shared/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/ui/chart";
import { formatBytes, formatMoney, formatNumber } from "@/shared/utils/format";

// Données fictives de démonstration uniquement (galerie locale, jamais en production).
const sales = [12, 18, 15, 22, 30, 27, 35].map((value, index) => ({
  day: `J${index + 1}`,
  ventes: value * 1000,
  remboursements: Math.round(value * 80),
}));

const chartConfig = {
  ventes: { label: "Ventes", color: "var(--chart-4)" },
  remboursements: { label: "Remboursements", color: "var(--chart-2)" },
} satisfies ChartConfig;

/** Composants du Lot 2 : relief obtenu uniquement avec les tokens du thème. */
export function ExpressiveSpecimens() {
  const ago = (minutes: number) =>
    new Date(Date.now() - minutes * 60_000).toISOString();
  return (
    <div className="mt-10 space-y-10">
      <PageSection
        title="Relief — chiffres"
        description="StatTile : valeur animée, évolution, tendance."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Revenu net"
            icon="sale"
            value={184500}
            format={(v) => formatMoney(v, "XAF")}
            delta={0.12}
            trend={[12, 18, 15, 22, 30, 27, 35]}
            context="vs 7 jours précédents"
          />
          <StatTile
            label="Accès actifs"
            icon="access"
            value={42}
            format={(v) => formatNumber(v)}
            delta={-0.05}
            trend={[50, 48, 45, 47, 44, 43, 42]}
          />
          <StatTile
            label="Routeurs en ligne"
            icon="router"
            value={7}
            format={(v) => `${formatNumber(v)} / 8`}
          />
          <StatTile
            label="Remboursements"
            icon="refund"
            value={2}
            format={(v) => formatNumber(v)}
            delta={0.5}
            higherIsBetter={false}
          />
        </div>
      </PageSection>

      <PageSection
        title="Relief — graphique"
        description="Chart shadcn, séries en chart-4 et chart-2."
      >
        <ChartContainer config={chartConfig} className="h-56 w-full">
          <AreaChart data={sales} margin={{ left: 0, right: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="ventes"
              type="monotone"
              fill="var(--color-ventes)"
              fillOpacity={0.15}
              stroke="var(--color-ventes)"
              strokeWidth={1.75}
            />
            <Area
              dataKey="remboursements"
              type="monotone"
              fill="var(--color-remboursements)"
              fillOpacity={0.1}
              stroke="var(--color-remboursements)"
              strokeWidth={1.75}
            />
          </AreaChart>
        </ChartContainer>
      </PageSection>

      <PageSection title="Relief — objets et statuts">
        <div className="flex flex-wrap items-center gap-3">
          {(Object.keys(objectIcons) as ObjectType[]).map((type) => (
            <IconTile key={type} type={type} />
          ))}
        </div>
        <div className="flex flex-wrap gap-6">
          <StatusDot label="En ligne" tone="success" live />
          <StatusDot label="Versement en cours" tone="info" live />
          <StatusDot label="Quota presque atteint" tone="warning" />
          <StatusDot label="Hors ligne" tone="danger" />
          <StatusDot label="Brouillon" />
        </div>
        <div className="grid max-w-md gap-4">
          <Meter
            label="Données consommées"
            value={1.2e9}
            max={5e9}
            valueLabel={`${formatBytes(1.2e9)} sur ${formatBytes(5e9)}`}
          />
          <Meter
            label="Sessions simultanées"
            value={2}
            max={2}
            valueLabel="2 sur 2"
          />
          <Meter label="Volume" value={0} max={null} />
        </div>
      </PageSection>

      <PageSection title="Relief — listes et détails">
        <DataToolbar
          search=""
          onSearch={() => {}}
          active={[
            { key: "site", label: "Site : Douala Centre", onRemove: () => {} },
          ]}
          count={12}
          countLabel="accès"
          filters={
            <Button variant="outline" size="sm">
              + Filtre
            </Button>
          }
        />
        <KeyValueList
          items={[
            {
              label: "Identifiant",
              value: (
                <CopyableId
                  value="trf_mDiIM2FzB3ATisAQQAUyE"
                  label="identifiant du transfert"
                />
              ),
            },
            { label: "Montant", value: <AmountExample /> },
            { label: "Ville", value: "Douala", hint: "Quartier Akwa" },
          ]}
        />
        <Timeline
          events={[
            { id: "1", title: "Retrait demandé", at: ago(90) },
            {
              id: "2",
              title: "Approuvé",
              description: "Montant conforme",
              at: ago(30),
            },
            { id: "3", title: "Versement en cours", tone: "info", at: ago(2) },
            { id: "4", title: "Versé", upcoming: true },
          ]}
        />
      </PageSection>

      <PageSection title="Relief — états vides et réussite">
        <div className="grid gap-4 lg:grid-cols-3">
          <EmptyState
            objectType="router"
            title="Aucun routeur"
            description="Déclarez l’équipement qui diffuse votre WiFi."
            actions={<Button size="sm">Ajouter un routeur</Button>}
          />
          <EmptyState
            objectType="access"
            variant="filtered"
            title="Aucun résultat"
            description="Aucun accès ne correspond à ces filtres."
            actions={
              <Button size="sm" variant="outline">
                Effacer les filtres
              </Button>
            }
          />
          <EmptyState
            objectType="offer"
            variant="prerequisite"
            title="Créez d’abord un site"
            description="Une offre appartient toujours à un site."
          />
        </div>
        <SuccessMoment
          title="Première vente !"
          description="Un client vient d’acheter « Pass 1 jour » sur Douala Centre."
          actions={<Button size="sm">Voir la vente</Button>}
        />
      </PageSection>
    </div>
  );
}
