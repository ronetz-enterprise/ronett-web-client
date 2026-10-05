import { ExpressiveSpecimens } from "./expressive-preview";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/ui/select";
import {
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableCaption,
} from "@/shared/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import {
  PageHeader,
  StatusBadge,
  EmptyState,
} from "@/shared/components/feedback";
import {
  PageSection,
  MetricCard,
  SummaryCard,
  DataTable,
  TableSkeleton,
} from "@/shared/components/page-patterns";
import { type StatusTone } from "@/shared/components/status";

const palette = [
  ["Fond", "bg-background text-foreground"],
  ["Surface", "bg-card text-card-foreground"],
  ["Flottant", "bg-popover text-popover-foreground"],
  ["Primaire", "bg-primary text-primary-foreground"],
  ["Neutre", "bg-muted text-muted-foreground"],
  ["Succès", "bg-success text-success-foreground"],
  ["Attention", "bg-warning text-warning-foreground"],
  ["Information", "bg-info text-info-foreground"],
  ["Erreur", "bg-danger text-danger-foreground"],
];
const tones: [StatusTone, string][] = [
  ["neutral", "Neutre"],
  ["info", "Information"],
  ["success", "Actif"],
  ["warning", "Suspendu"],
  ["danger", "Révoqué"],
  ["pending", "En attente"],
];
function Specimens({ prefix }: { prefix: string }) {
  const [density, setDensity] = useState<"standard" | "compact">("standard");
  return (
    <div className="space-y-8">
      <PageHeader
        title="Console Ronetz"
        description="Spécimens de présentation — données fictives, sans opérations métier."
        status={<StatusBadge tone="info" label="Référence" />}
      />
      <PageSection title="Couleurs et surfaces">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {palette.map(([label, classes]) => (
            <div
              key={label}
              className={`rounded-lg border p-4 text-xs ${classes}`}
            >
              {label}
            </div>
          ))}
        </div>
      </PageSection>
      <PageSection title="Typographie">
        <p className="font-heading text-lg font-semibold">
          Titre de section · Geist semibold
        </p>
        <p>Corps et données · Geist · 15 px</p>
        <p className="text-xs text-muted-foreground">Métadonnées · 13 px</p>
      </PageSection>
      <PageSection title="Actions">
        <div className="flex flex-wrap gap-2">
          <Button>Enregistrer</Button>
          <Button variant="secondary">Continuer</Button>
          <Button variant="outline">Exporter</Button>
          <Button variant="ghost">Détails</Button>
          <Button variant="destructive">Supprimer</Button>
          <Button disabled>Indisponible</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Variantes présentées côte à côte uniquement pour comparaison.
        </p>
      </PageSection>
      <PageSection title="Champs">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor={prefix + "-name"} className="font-medium">
              Nom du site
            </label>
            <Input id={prefix + "-name"} placeholder="Ex. Agence centrale" />
          </div>
          <div className="space-y-2">
            <label htmlFor={prefix + "-status"} className="font-medium">
              État
            </label>
            <Select defaultValue="active">
              <SelectTrigger id={prefix + "-status"} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="paused">Suspendu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PageSection>
      <PageSection title="Statuts">
        <div className="flex flex-wrap gap-2">
          {tones.map(([tone, label]) => (
            <StatusBadge key={tone} tone={tone} label={label} />
          ))}
        </div>
      </PageSection>
      <PageSection title="Indicateur et résumé">
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            label="Routeurs en ligne"
            value="12 / 14"
            context="Exemple fictif · à l’instant"
          />
          <SummaryCard
            title="Agence centrale"
            description="Exemple de ressource"
          >
            <StatusBadge label="Actif" tone="success" />
            <p className="mt-3 text-muted-foreground">Douala · 2 routeurs</p>
          </SummaryCard>
        </div>
      </PageSection>
      <PageSection
        title="Tableau"
        actions={
          <Button
            variant="outline"
            aria-pressed={density === "compact"}
            onClick={() =>
              setDensity(density === "standard" ? "compact" : "standard")
            }
          >
            Densité compacte
          </Button>
        }
      >
        <DataTable density={density}>
          <TableCaption>Ressources fictives</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Ressource</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Connexions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Agence centrale</TableCell>
              <TableCell>
                <StatusBadge label="Actif" tone="success" />
              </TableCell>
              <TableCell className="text-right tabular-nums">128</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Agence nord</TableCell>
              <TableCell>
                <StatusBadge label="Suspendu" tone="warning" />
              </TableCell>
              <TableCell className="text-right tabular-nums">0</TableCell>
            </TableRow>
          </TableBody>
        </DataTable>
      </PageSection>
      <PageSection title="États et retours">
        <EmptyState
          title="Aucun site créé"
          description="Vos sites apparaîtront ici après leur création."
        />
        <EmptyState
          title="Aucun résultat"
          description="Essayez d’autres critères de recherche."
        />
        <EmptyState
          title="Accès insuffisant"
          description="Contactez un responsable de votre organisation."
        />
        <EmptyState
          title="Service non configuré"
          description="La configuration de ce service est nécessaire avant son utilisation."
        />
        <Alert variant="destructive" role="note">
          <AlertTitle>Une erreur est survenue</AlertTitle>
          <AlertDescription>
            Le service est temporairement indisponible.
          </AlertDescription>
        </Alert>
        <Alert role="note">
          <AlertTitle>Modification enregistrée</AlertTitle>
          <AlertDescription>
            Vos préférences ont été mises à jour.
          </AlertDescription>
        </Alert>
        <TableSkeleton />
      </PageSection>
    </div>
  );
}
export function DesignSystemPreview() {
  const [dark, setDark] = useState(false);
  return (
    <section aria-label="Référence visuelle" className="space-y-4">
      <Button
        variant="outline"
        aria-pressed={dark}
        onClick={() => setDark(!dark)}
      >
        Aperçu du thème sombre
      </Button>
      <p className="text-sm text-muted-foreground">
        La galerie suit le thème système. Ce contrôle permet aussi de forcer son
        aperçu sombre.
      </p>
      <div className={dark ? "dark" : ""}>
        <div className="rounded-lg border bg-background p-4 text-foreground sm:p-6">
          <Specimens prefix="reference" />
          <ExpressiveSpecimens />
        </div>
      </div>
    </section>
  );
}
