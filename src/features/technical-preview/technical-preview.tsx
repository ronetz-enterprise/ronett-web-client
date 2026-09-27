import { useHydrated } from "@/shared/hooks/use-hydrated";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { httpClient } from "@/shared/api/http-client";
import { TechnicalError } from "@/shared/components/feedback";
import {
  FormField,
  ValidatedForm,
  zodResolver,
} from "@/shared/components/form";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
const schema = z.object({ label: z.string().min(1, "Saisissez un libellé.") });
export function TechnicalPreview() {
  const hydrated = useHydrated();
  const [error, setError] = useState<unknown>();
  const [status, setStatus] = useState("");
  const form = useForm({
    defaultValues: { label: "" },
    resolver: zodResolver(schema),
    shouldFocusError: true,
  });
  async function simulate() {
    try {
      await httpClient("/__mocks/500");
    } catch (failure) {
      setError(failure);
    }
  }
  return (
    <div className="space-y-6">
      <Button disabled={!hydrated} onClick={() => void simulate()}>
        Simuler une erreur technique
      </Button>
      {error !== undefined && <TechnicalError error={error} />}
      <ValidatedForm
        form={form}
        onSubmit={async () => {
          setStatus("Validation réussie.");
        }}
      >
        <FormField name="label" label="Libellé de test" />
      </ValidatedForm>
      <ConfirmDialog
        trigger="Tester la confirmation"
        title="Confirmer le test"
        description="Cette action technique ne modifie aucune donnée."
        onConfirm={async () => {
          setStatus("Confirmation réussie.");
        }}
      />
      <p role="status">{status}</p>
    </div>
  );
}
