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
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
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
}: {
  name: string;
  label: string;
  description?: string;
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
}: {
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  children: React.ReactNode;
  submitLabel?: string;
}) {
  const lock = useRef(false);
  const { isSubmitting, submitCount, errors } = form.formState;
  useEffect(() => {
    if (isSubmitting || submitCount === 0) return;
    const first = Object.keys(errors).find((name) => name !== "root");
    if (first) form.setFocus(first as Path<T>);
  }, [isSubmitting, submitCount, errors, form]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
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
        noValidate
        onSubmit={(event) => void submit(event)}
        aria-busy={form.formState.isSubmitting}
      >
        <fieldset disabled={form.formState.isSubmitting} className="space-y-4">
          {children}
          <Button type="submit">
            {form.formState.isSubmitting ? "En cours…" : submitLabel}
          </Button>
        </fieldset>
        {form.formState.errors.root?.message && (
          <p role="alert">{form.formState.errors.root.message}</p>
        )}
      </form>
    </FormProvider>
  );
}
