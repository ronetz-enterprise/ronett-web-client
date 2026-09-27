import { TechnicalPreview } from "@/features/technical-preview";
import { config } from "@/shared/config/environment";
import { PageHeader } from "@/shared/components/feedback";
export function loader() {
  if (!config.isDevelopment || !config.enableMocks)
    throw new Response(null, { status: 404 });
  return null;
}
export default function DiagnosticsPage() {
  return (
    <main className="mx-auto max-w-xl space-y-6 p-4">
      <PageHeader
        title="Vérification du socle"
        description="Outils techniques locaux, sans API métier."
      />
      <TechnicalPreview />
    </main>
  );
}
