import { useFormDialog } from "@/shared/components/form-dialog-context";
import { useId } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import type { Membership } from "@/features/memberships";
import { FormField, ValidatedForm } from "@/shared/components/form";
import {
  applyApiFieldErrors,
  zodResolver,
} from "@/shared/components/form-utils";
import { notificationManager } from "@/shared/components/notifications";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { ApiError } from "@/shared/errors/api-error";
import {
  siteFormSchema,
  siteRoutes,
  type Site,
  type SiteFormValues,
  type UpdateSiteRequest,
} from "../model/site";
import { useSiteChange } from "../queries/sites";
import { SiteFailure } from "./site-shared";

const fields = [
  "name",
  "city",
  "district",
  "addressDetails",
  "description",
  "timezone",
] as const;
export function SiteForm({
  active,
  site,
}: {
  active: Membership;
  site?: Site;
}) {
  const navigate = useNavigate();
  const dialog = useFormDialog();
  const mutation = useSiteChange(active);
  const descriptionId = useId();
  const form = useForm<SiteFormValues>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: {
      name: site?.name ?? "",
      city: site?.city ?? "",
      district: site?.district ?? "",
      description: site?.description ?? "",
      addressDetails: site?.addressDetails ?? "",
      timezone: site?.timezone ?? "Africa/Douala",
    },
  });
  const cancel = site
    ? siteRoutes.detail(active.organizationId, site.id)
    : siteRoutes.list(active.organizationId);
  async function save(values: SiteFormValues) {
    try {
      // PATCH only edited fields, preserving concurrent unrelated changes.
      const changes: UpdateSiteRequest = {};
      for (const key of fields)
        if (form.formState.dirtyFields[key]) changes[key] = values[key];
      const result = await mutation.change(
        site
          ? { action: "update", site, values: changes }
          : { action: "create", values },
      );
      if (!result.applied || !result.site) return;
      notificationManager.add({
        title: site ? "Site mis à jour" : "Site créé",
        description: result.site.name,
      });
      void navigate(siteRoutes.detail(active.organizationId, result.site.id));
    } catch (error) {
      applyApiFieldErrors(error, form, fields);
      if (
        error instanceof ApiError &&
        error.problem?.type?.endsWith("/duplicate-site-name")
      )
        form.setError(
          "name",
          { message: "Ce nom est déjà utilisé dans cette organisation." },
          { shouldFocus: true },
        );
    }
  }
  return (
    <div className="space-y-4">
      <ValidatedForm
        form={form}
        onSubmit={save}
        disabled={mutation.pending}
        submitLabel={site ? "Enregistrer" : "Créer le site"}
        footer={
          <Button
            variant={dialog ? "secondary" : "outline"}
            className={dialog ? undefined : "rounded-full"}
            disabled={mutation.pending}
            {...(dialog
              ? { onClick: dialog.close }
              : {
                  nativeButton: false,
                  role: "link",
                  render: <Link to={cancel} />,
                })}
          >
            Annuler
          </Button>
        }
      >
        <div
          className={
            dialog ? "grid gap-y-5" : "grid gap-x-6 gap-y-5 sm:grid-cols-2"
          }
        >
          <FormField
            name="name"
            label="Nom du site"
            description="Obligatoire · 150 caractères maximum."
          />
          <FormField
            name="city"
            label="Ville"
            description="Obligatoire · 150 caractères maximum."
          />
          <FormField name="district" label="Quartier (facultatif)" />
          <FormField
            name="timezone"
            label="Heure locale"
            description="Fuseau horaire du site, par exemple Africa/Douala. Il sert à dater les connexions et les ventes."
          />
        </div>
        <FormField
          name="addressDetails"
          label="Précisions d’adresse (facultatif)"
          description="500 caractères maximum."
        />
        <div className="space-y-2">
          <label htmlFor={descriptionId} className="text-sm font-medium">
            Description (facultatif)
          </label>
          <Textarea
            id={descriptionId}
            {...form.register("description")}
            maxLength={2000}
            aria-invalid={!!form.formState.errors.description}
            aria-describedby={`${descriptionId}-help ${descriptionId}-error`}
          />
          <p
            id={`${descriptionId}-help`}
            className="text-sm text-muted-foreground"
          >
            2 000 caractères maximum.
          </p>
          <p
            id={`${descriptionId}-error`}
            className="text-sm text-destructive"
            aria-live="polite"
          >
            {form.formState.errors.description?.message}
          </p>
        </div>
      </ValidatedForm>
      {mutation.isError && <SiteFailure error={mutation.error} />}
    </div>
  );
}
