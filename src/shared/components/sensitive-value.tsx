import { useState } from "react";
import { Button } from "@/shared/ui/button";
export function SensitiveValue({
  value,
  label = "Valeur sensible",
}: {
  value: string;
  label?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("Valeur copiée.");
    } catch {
      setStatus("Copie indisponible.");
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span>{label}</span>
      <span className="break-all">{revealed ? value : "••••••••"}</span>
      <Button
        variant="outline"
        aria-pressed={revealed}
        onClick={() => setRevealed(!revealed)}
      >
        {revealed ? "Masquer" : "Révéler"}
      </Button>
      <Button variant="outline" onClick={() => void copy()}>
        Copier la valeur
      </Button>
      <span role="status">{status}</span>
    </div>
  );
}
