import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  FormField,
  ValidatedForm,
  zodResolver,
  applyApiFieldErrors,
} from "@/shared/components/form";
import { PasswordField } from "@/shared/components/password-field";
import { CorrelationIdDisplay } from "@/shared/components/feedback";
import { ApiError } from "@/shared/errors/api-error";
import { useHydrated } from "@/shared/hooks/use-hydrated";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "../schemas/authentication";
import { authenticationApi } from "../api/authentication-api";
import { useAuth } from "../hooks/auth-provider";
import { authErrorMessage } from "../lib/auth-errors";
function ErrorReference({ error }: { error: unknown }) {
  return error instanceof ApiError &&
    error.correlationId &&
    (error.status >= 500 || error.kind !== "http") ? (
    <CorrelationIdDisplay correlationId={error.correlationId} />
  ) : null;
}
export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const auth = useAuth();
  const hydrated = useHydrated();
  const [error, setError] = useState<unknown>();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  return (
    <>
      <ValidatedForm
        form={form}
        disabled={!hydrated || auth.status === "initializing"}
        submitLabel="Se connecter"
        onSubmit={async (input) => {
          setError(undefined);
          try {
            await auth.login(input);
            form.reset();
            onSuccess();
          } catch (failure) {
            setError(failure);
            form.resetField("password");
            applyApiFieldErrors(failure, form, ["email", "password"]);
            form.setError("root", {
              message: authErrorMessage(failure, "login"),
            });
          }
        }}
      >
        <FormField
          name="email"
          label="Email"
          type="email"
          autoComplete="username"
        />
        <PasswordField />
      </ValidatedForm>
      <ErrorReference error={error} />
    </>
  );
}
export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const hydrated = useHydrated();
  const [error, setError] = useState<unknown>();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmation: "",
    },
  });
  return (
    <>
      <ValidatedForm
        form={form}
        disabled={!hydrated}
        submitLabel="Créer mon compte"
        onSubmit={async (input) => {
          setError(undefined);
          try {
            await authenticationApi.register(input);
            form.reset();
            onSuccess();
          } catch (failure) {
            setError(failure);
            form.resetField("password");
            form.resetField("confirmation");
            applyApiFieldErrors(failure, form, [
              "email",
              "firstName",
              "lastName",
              "password",
            ]);
            if (
              failure instanceof ApiError &&
              failure.problem?.errors?.some(
                (item) => item.field === "passwordWithinHashingLimit",
              )
            )
              form.setError("password", {
                message: "Le mot de passe dépasse 72 octets UTF-8.",
              });
            form.setError("root", {
              message: authErrorMessage(failure, "register"),
            });
          }
        }}
      >
        <FormField name="firstName" label="Prénom" autoComplete="given-name" />
        <FormField name="lastName" label="Nom" autoComplete="family-name" />
        <FormField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
        />
        <PasswordField autoComplete="new-password" />
        <PasswordField
          name="confirmation"
          label="Confirmation du mot de passe"
          autoComplete="new-password"
        />
      </ValidatedForm>
      <ErrorReference error={error} />
    </>
  );
}
