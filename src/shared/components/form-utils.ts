import { z } from "zod";
import type {
  FieldErrors,
  FieldValues,
  Path,
  Resolver,
  UseFormReturn,
} from "react-hook-form";
import { ApiError, extractFieldErrors } from "@/shared/errors/api-error";

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
