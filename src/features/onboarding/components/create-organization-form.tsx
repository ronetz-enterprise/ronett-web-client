import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  FormField,
  ValidatedForm,
  zodResolver,
  applyApiFieldErrors,
} from "@/shared/components/form";
import { CorrelationIdDisplay } from "@/shared/components/feedback";
import { ApiError, toUserMessage } from "@/shared/errors/api-error";
import { useHydrated } from "@/shared/hooks/use-hydrated";
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from "../schemas/create-organization";
import { useCreationAttempt } from "../hooks/onboarding-provider";
export function CreateOrganizationForm() {
  const attempt = useCreationAttempt();
  const hydrated = useHydrated();
  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: { name: "", currency: "" },
  });
  return (
    <>
      <ValidatedForm
        form={form}
        disabled={!hydrated || !["idle", "failed"].includes(attempt.status)}
        submitLabel="Créer l’organisation"
        onSubmit={async (input) => {
          form.clearErrors();
          await attempt.submit(input);
        }}
      >
        <FormField
          name="name"
          label="Nom de l’organisation"
          autoComplete="organization"
        />
        <FormField
          name="currency"
          label="Devise"
          description="Code à trois lettres, par exemple XAF ou EUR."
          autoComplete="off"
        />
      </ValidatedForm>
      <CreationError error={attempt.error} form={form} />
    </>
  );
}
function CreationError({
  error,
  form,
}: {
  error: unknown;
  form: ReturnType<typeof useForm<CreateOrganizationInput>>;
}) {
  // Mapping runs after the disabled fieldset has been re-enabled.
  useMapCreationErrors(error, form);
  return error instanceof ApiError && error.correlationId ? (
    <CorrelationIdDisplay correlationId={error.correlationId} />
  ) : null;
}
function useMapCreationErrors(
  error: unknown,
  form: ReturnType<typeof useForm<CreateOrganizationInput>>,
) {
  useEffect(() => {
    if (!error) return;
    applyApiFieldErrors(error, form, ["name", "currency"]);
    form.setError("root", {
      message:
        error instanceof ApiError && error.status === 409
          ? "La création a été refusée. Vérifiez les informations avant de réessayer."
          : toUserMessage(error),
    });
  }, [error, form]);
}
