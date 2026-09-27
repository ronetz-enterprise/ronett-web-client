import { TechnicalError } from "@/shared/components/feedback";
export default function UnexpectedErrorPage({ error }: { error?: unknown }) {
  return (
    <main className="mx-auto max-w-xl p-6">
      <TechnicalError error={error} />
    </main>
  );
}
