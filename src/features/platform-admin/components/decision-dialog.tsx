import { FormDialogContent } from "@/shared/components/form-dialog";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField, ValidatedForm } from "@/shared/components/form";
import { zodResolver } from "@/shared/components/form-utils";
import { toUserMessage } from "@/shared/errors/api-error";
import { Dialog } from "@/shared/ui/dialog";
import { decisionReasonSchema } from "../model/platform";

/**
 * Décision administrative : récapitulatif, motif obligatoire journalisé, et, pour une action à
 * fort impact, une case de confirmation explicite. Le code de confirmation attendu par le
 * serveur est envoyé par la mutation, jamais saisi par l'utilisateur.
 */
export function DecisionDialog({
  title,
  description,
  summary,
  submitLabel,
  confirmLabel,
  busy,
  error,
  onSubmit,
  onClose,
}: {
  title: string;
  description: string;
  summary?: ReactNode;
  submitLabel: string;
  /** Texte de la case à cocher ; absent = pas de confirmation demandée. */
  confirmLabel?: string;
  busy: boolean;
  error: unknown;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}) {
  const schema = z.object({
    reason: decisionReasonSchema,
    confirmed: confirmLabel
      ? z.literal(true, { error: "Cochez la case pour confirmer." })
      : z.boolean(),
  });
  const form = useForm<
    z.input<typeof schema>,
    unknown,
    z.output<typeof schema>
  >({
    resolver: zodResolver(schema),
    defaultValues: { reason: "", confirmed: false },
  });
  const confirmError = form.formState.errors.confirmed?.message;
  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <FormDialogContent
        title={title}
        description={description}
        onClose={onClose}
        showCloseButton={!busy}
      >
        {summary}
        <ValidatedForm
          form={form}
          submitLabel={submitLabel}
          disabled={busy}
          guardUnsavedChanges={false}
          onSubmit={(values) => onSubmit(values.reason)}
        >
          <FormField
            name="reason"
            label="Motif"
            description="Entre 10 et 1 000 caractères, conservé dans le journal d’audit."
            autoComplete="off"
          />
          {confirmLabel && (
            <div className="space-y-1">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-primary"
                  aria-invalid={!!confirmError}
                  {...form.register("confirmed")}
                />
                {confirmLabel}
              </label>
              {confirmError && (
                <p role="alert" className="text-sm text-destructive">
                  {confirmError}
                </p>
              )}
            </div>
          )}
          {error !== null && error !== undefined && (
            <p role="alert" className="text-sm text-destructive">
              {toUserMessage(error)}
            </p>
          )}
        </ValidatedForm>
      </FormDialogContent>
    </Dialog>
  );
}
