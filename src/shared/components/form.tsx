import { useEffect, useId, useRef, type FormEvent } from "react";
import { z } from "zod";
import {
  FormProvider,
  useFormContext,
  type FieldErrors,
  type FieldValues,
  type Path,
  type Resolver,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { cn } from "cn";
import {
  ApiError,
  extractFieldErrors,
  toUserMessage,
} from "@/shared/errors/api-error";

// Scoped to flat technical forms. Nested schemas should use an explicit adapter.
export function zodResolver<T extends FieldValues>(
  schema: z.ZodType<T, T>,
): Resolver<T> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) return { values: result.data, errors: {} };
    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const name = issue.path.length === 1 ? String(issue.path[0]) : "root";
      errors[name] ??= { type: "validation", message: issue.message };
    }
    return { values: {}, errors: errors as FieldErrors<T> };
  };
}
export function applyApiFieldErrors<T extends FieldValues>(
  error: unknown,
  form: UseFormReturn<T>,
  allowedFields: readonly Path<T>[],
) {
  if (!(error instanceof ApiError)) return false;
  const fields = extractFieldErrors(error.problem);
  let first = true;
  for (const field of allowedFields) {
    if (fields[field]) {
      // Raw server messages remain diagnostic data; only safe UX copy is rendered.
      form.setError(
        field,
        { type: "server", message: "Vérifiez ce champ." },
        { shouldFocus: first },
      );
      first = false;
    }
  }
  return !first;
}
export function FormField({
  name,
  label,
  description,
  type = "text",
  autoComplete,
}: {
  name: string;
  label: string;
  description?: string;
  autoComplete?: string;
  type?: React.ComponentProps<typeof Input>["type"];
}) {
  const id = useId();
  const { register, getFieldState, formState } = useFormContext();
  const { error } = getFieldState(name, formState);
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        {...register(name)}
        aria-invalid={!!error}
        aria-describedby={`${id}-description ${id}-error`}
      />
      <p id={`${id}-description`} className="text-sm text-muted-foreground">
        {description}
      </p>
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
}: {
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  children: React.ReactNode;
  submitLabel?: string;
  disabled?: boolean;
  /** Actions secondaires alignees a gauche du bouton de soumission. */
  footer?: React.ReactNode;
}) {
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
  return (
    <FormProvider {...form}>
      <form
        ref={element}
        method="post"
        noValidate
        onSubmit={(event) => void submit(event)}
        aria-busy={form.formState.isSubmitting}
      >
        <fieldset
          disabled={disabled || form.formState.isSubmitting}
          className="space-y-4"
        >
          {children}
          <div
            className={cn(
              "flex flex-wrap items-center gap-2",
              footer && "justify-end",
            )}
          >
            {footer}
            <Button
              type="submit"
              className="relative min-h-10"
              aria-busy={isSubmitting}
            >
              <span aria-hidden="true" className="size-4" />
              {submitLabel}
              <span
                aria-hidden="true"
                className={
                  isSubmitting
                    ? "size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                    : "size-4"
                }
              />
              {isSubmitting && <span className="sr-only"> — En cours…</span>}
            </Button>
          </div>
        </fieldset>
        {form.formState.errors.root?.message && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}
      </form>
    </FormProvider>
  );
}
