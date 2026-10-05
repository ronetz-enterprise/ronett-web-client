import { FieldHeader } from "@/shared/components/field-header";
import {
  dialogFooterClass,
  useFormDialog,
} from "@/shared/components/form-dialog-context";
import { UnsavedChangesGuard } from "./unsaved-changes";
import { useOnline } from "@/shared/hooks/use-online";
import { useEffect, useId, useRef, type FormEvent } from "react";
import {
  FormProvider,
  useFormContext,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { cn } from "cn";
import { toUserMessage } from "@/shared/errors/api-error";

export function FormField({
  name,
  label,
  description,
  type = "text",
  autoComplete,
  endAdornment,
  placeholder,
  after,
}: {
  /** Contrôles placés juste après le champ (ex. : valider / annuler la modification). */
  after?: React.ReactNode;
  name: string;
  placeholder?: string;
  label: string;
  description?: string;
  autoComplete?: string;
  type?: React.ComponentProps<typeof Input>["type"];
  /** Contrôle placé à l'intérieur du champ, à droite (ex. : afficher le mot de passe). */
  endAdornment?: React.ReactNode;
}) {
  const id = useId();
  const { register, getFieldState, formState } = useFormContext();
  const { error } = getFieldState(name, formState);
  const dialog = useFormDialog();
  return (
    <div className="space-y-2">
      {dialog ? (
        <FieldHeader
          htmlFor={id}
          label={label}
          description={description}
          descriptionId={`${id}-description`}
        />
      ) : (
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Input
            id={id}
            type={type}
            autoComplete={autoComplete}
            placeholder={placeholder}
            {...register(name)}
            aria-invalid={!!error}
            aria-describedby={`${id}-description ${id}-error`}
            className={cn(endAdornment && "pr-10")}
          />
          {endAdornment && (
            <div className="absolute inset-y-0 right-1 flex items-center">
              {endAdornment}
            </div>
          )}
        </div>
        {after}
      </div>
      {!dialog && (
        <p
          id={`${id}-description`}
          className="text-sm text-muted-foreground empty:hidden"
        >
          {description}
        </p>
      )}
      <p
        id={`${id}-error`}
        aria-live="polite"
        className="text-sm text-destructive"
      >
        {error?.message}
      </p>
    </div>
  );
}
export function ValidatedForm<T extends FieldValues>({
  form,
  onSubmit,
  children,
  submitLabel = "Valider",
  disabled = false,
  footer,
  guardUnsavedChanges = true,
  hideActions = false,
}: {
  /** Pas de bouton global : chaque champ se valide séparément (modification en place). */
  hideActions?: boolean;
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  children: React.ReactNode;
  submitLabel?: string;
  disabled?: boolean;
  /** Actions secondaires alignees a gauche du bouton de soumission. */
  footer?: React.ReactNode;
  /** Demande confirmation avant de quitter une saisie modifiée (désactiver pour connexion/inscription). */
  guardUnsavedChanges?: boolean;
}) {
  const online = useOnline();
  const lock = useRef(false);
  const element = useRef<HTMLFormElement>(null);
  const { isSubmitting, submitCount, errors } = form.formState;
  useEffect(() => {
    if (isSubmitting || submitCount === 0) return;
    // Follow visible form order, independently of schema/server error ordering.
    element.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [isSubmitting, submitCount, errors, form]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || disabled) return;
    lock.current = true;
    try {
      await form.handleSubmit(onSubmit)(event);
    } catch (error) {
      form.setError("root", { type: "server", message: toUserMessage(error) });
    } finally {
      lock.current = false;
    }
  }
  const dialog = useFormDialog();
  return (
    <FormProvider {...form}>
      <UnsavedChangesGuard
        when={guardUnsavedChanges && form.formState.isDirty}
        // Pendant l'envoi, la redirection qui suit un succès ne doit pas être bloquée.
        bypass={() => lock.current}
      />
      <form
        ref={element}
        method="post"
        noValidate
        onSubmit={(event) => void submit(event)}
        aria-busy={form.formState.isSubmitting}
      >
        <fieldset
          disabled={disabled || form.formState.isSubmitting}
          className={dialog ? "space-y-6" : "space-y-4"}
        >
          {children}
          {form.formState.errors.root?.message && (
            <Alert
              variant="destructive"
              className="border-0 bg-danger px-3 py-2.5 text-sm text-danger-foreground *:data-[slot=alert-description]:text-danger-foreground"
            >
              <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={1.75} />
              <AlertDescription className="text-sm">
                {form.formState.errors.root.message}
              </AlertDescription>
            </Alert>
          )}
          <div
            className={cn(
              "flex flex-wrap items-center gap-2",
              footer && "justify-end",
              dialog && dialogFooterClass,
              hideActions && "hidden",
            )}
          >
            {footer ??
              (dialog && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={dialog.close}
                >
                  Annuler
                </Button>
              ))}
            {!online && (
              <p role="status" className="text-sm text-muted-foreground">
                Hors ligne : l’envoi reprendra au retour de la connexion.
              </p>
            )}
            <Button
              type="submit"
              disabled={!online}
              className="relative min-h-10"
              aria-busy={isSubmitting}
            >
              <span aria-hidden="true" className="size-4" />
              {submitLabel}
              <span
                aria-hidden="true"
                className={
                  isSubmitting
                    ? "size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
                    : "size-4"
                }
              />
              {isSubmitting && <span className="sr-only"> — En cours…</span>}
            </Button>
          </div>
        </fieldset>
      </form>
    </FormProvider>
  );
}
