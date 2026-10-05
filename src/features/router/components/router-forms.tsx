import { useFormDialog } from "@/shared/components/form-dialog-context";
import { useId, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Membership } from "@/features/memberships";
import { useSites, siteKeys, siteRoutes, type Site } from "@/features/site";
import {
  PageHeader,
  PageLoading,
  EmptyState,
} from "@/shared/components/feedback";
import { SummaryCard } from "@/shared/components/page-patterns";
import { ValidatedForm, FormField } from "@/shared/components/form";
import {
  zodResolver,
  applyApiFieldErrors,
} from "@/shared/components/form-utils";
import { notificationManager } from "@/shared/components/notifications";
import { SettingField } from "@/shared/components/settings-layout";
import { UnsavedChangesGuard } from "@/shared/components/unsaved-changes";
import { Input } from "@/shared/ui/input";
import { ApiError } from "@/shared/errors/api-error";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  routerCreateSchema,
  routerNameSchema,
  routerRoutes,
  routerCapabilities,
  routerModels,
  routerOsMinimum,
  supportedVendor,
  type Router,
  type RouterCreateValues,
} from "../model/router";
import { useRouterChange } from "../queries/routers";
import {
  RouterBreadcrumb,
  RouterFailure,
  transientRouterError,
} from "./router-shared";
import { RouterSetupSteps } from "./router-setup";

const OTHER_MODEL = "other";

/** Liste déroulante liée au formulaire, avec libellé, aide et erreur accessibles. */
function ChoiceField({
  label,
  description,
  placeholder,
  value,
  display,
  error,
  onChange,
  children,
}: {
  label: string;
  description?: string;
  placeholder: string;
  value: string;
  display?: ReactNode;
  error?: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="space-y-2">
      <label id={`${id}-label`} htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Select
        value={value || null}
        onValueChange={(next) => onChange(String(next ?? ""))}
      >
        <SelectTrigger
          id={id}
          aria-labelledby={`${id}-label`}
          aria-invalid={!!error}
          aria-describedby={`${id}-help ${id}-error`}
          className="w-full"
        >
          <SelectValue placeholder={placeholder}>{display}</SelectValue>
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
      {description && (
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      <p
        id={`${id}-error`}
        className="text-sm text-destructive"
        aria-live="polite"
      >
        {error}
      </p>
    </div>
  );
}

export function RouterCreate({
  active,
  siteId,
}: {
  active: Membership;
  siteId?: string;
}) {
  const sites = useSites(active);
  const dialog = useFormDialog();
  if (!routerCapabilities(active).canCreateRouter)
    return <RouterFailure error={new ApiError("http", 403)} />;
  if (siteId && !z.uuid().safeParse(siteId).success)
    return <RouterFailure error={new ApiError("http", 404)} />;
  if (sites.isPending) return <PageLoading variant="form" />;
  if (!sites.data || (sites.isError && !transientRouterError(sites.error)))
    return (
      <RouterFailure error={sites.error} retry={() => void sites.refetch()} />
    );
  const preset = sites.data.find((site) => site.id === siteId);
  if (siteId && !preset)
    return <RouterFailure error={new ApiError("http", 404)} />;
  const choices = sites.data.filter((site) => site.status === "ACTIVE");
  const org = active.organizationId;
  const back = siteId ? siteRoutes.detail(org, siteId) : routerRoutes.list(org);
  return (
    <div className={dialog ? "space-y-6" : "max-w-2xl space-y-6"}>
      {!dialog && (
        <PageHeader
          title="Ajouter un routeur"
          description="Indiquez où le routeur sera installé et de quel équipement il s’agit."
          breadcrumb={<RouterBreadcrumb org={org} current="Nouveau routeur" />}
        />
      )}
      {!dialog && <RouterSetupSteps current={0} />}
      {choices.length === 0 ? (
        <EmptyState
          variant="prerequisite"
          title={
            sites.data.length === 0
              ? "Créez d’abord un site"
              : "Aucun site actif pour l’instant"
          }
          description={
            sites.data.length === 0
              ? "Un routeur est toujours rattaché à un site : le lieu où votre WiFi est proposé."
              : "Un routeur doit être rattaché à un site actif. Réactivez l’un de vos sites ou créez-en un nouveau."
          }
          actions={
            <>
              <Button render={<Link to={siteRoutes.create()} />}>
                Créer un site
              </Button>
              {sites.data.length > 0 && (
                <Button
                  nativeButton={false}
                  role="link"
                  variant="outline"
                  render={<Link to={siteRoutes.list(org)} />}
                >
                  Voir mes sites
                </Button>
              )}
            </>
          }
        />
      ) : (
        <RouterCreateForm
          active={active}
          choices={choices}
          initialSite={preset?.status === "ACTIVE" ? preset.id : ""}
          unavailable={preset?.status === "ACTIVE" ? undefined : preset}
          back={back}
        />
      )}
    </div>
  );
}
function RouterCreateForm({
  active,
  choices,
  initialSite,
  unavailable,
  back,
}: {
  active: Membership;
  choices: Site[];
  initialSite: string;
  /** Site reçu en lien mais inactif : signalé, sans bloquer le choix d'un autre. */
  unavailable?: Site;
  back: string;
}) {
  const mutation = useRouterChange(active);
  const client = useQueryClient();
  const navigate = useNavigate();
  const dialog = useFormDialog();
  const form = useForm<RouterCreateValues>({
    resolver: zodResolver(routerCreateSchema),
    // Site and model are lists, not registered inputs: ValidatedForm focuses the first
    // invalid control in visible order instead.
    shouldFocusError: false,
    defaultValues: {
      name: "",
      vendor: supportedVendor,
      model: "",
      siteId: initialSite,
    },
  });
  const [otherModel, setOtherModel] = useState(false);
  const selectedId = form.watch("siteId");
  const model = form.watch("model");
  const selected = choices.find((site) => site.id === selectedId);
  const errors = form.formState.errors;
  async function save(values: RouterCreateValues) {
    try {
      const router = await mutation.change({ action: "create", values });
      if (!router) return;
      notificationManager.add({
        title: "Routeur ajouté",
        description: "Étape suivante : générer son script d’installation.",
      });
      void navigate(
        routerRoutes.detail(
          active.organizationId,
          router.id,
          router.siteId ?? undefined,
        ),
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        // The chosen site became inactive: refresh the choices and point at the field.
        void client.invalidateQueries({
          queryKey: siteKeys.list(active.organizationId),
        });
        form.setError(
          "siteId",
          {
            type: "server",
            message: "Ce site n’est plus actif. Choisissez-en un autre.",
          },
          { shouldFocus: true },
        );
        return;
      }
      applyApiFieldErrors(error, form, ["name", "model", "siteId"]);
    }
  }
  const conflict =
    mutation.error instanceof ApiError && mutation.error.status === 409;
  return (
    <SummaryCard title="Identifier le routeur">
      <ValidatedForm
        form={form}
        onSubmit={save}
        disabled={mutation.pending}
        submitLabel="Ajouter le routeur"
        footer={
          <Button
            nativeButton={false}
            role="link"
            variant={dialog ? "secondary" : "ghost"}
            disabled={mutation.pending}
            {...(dialog
              ? { onClick: dialog.close }
              : {
                  nativeButton: false,
                  role: "link",
                  render: <Link to={back} />,
                })}
          >
            Annuler
          </Button>
        }
      >
        {unavailable && (
          <Alert>
            <AlertDescription>
              Le site « {unavailable.name} » n’est pas actif. Choisissez un
              autre site pour ce routeur.
            </AlertDescription>
          </Alert>
        )}
        <ChoiceField
          label="Site"
          description="Le lieu où ce routeur diffusera votre WiFi."
          placeholder="Choisir un site"
          value={selectedId}
          display={selected?.name}
          error={errors.siteId?.message}
          onChange={(value) =>
            form.setValue("siteId", value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        >
          {choices.map((site) => (
            <SelectItem key={site.id} value={site.id}>
              {site.name} · {site.city}
            </SelectItem>
          ))}
        </ChoiceField>
        <div className="space-y-3">
          <ChoiceField
            label={`Modèle ${supportedVendor}`}
            description={`Ronetz prend en charge les routeurs ${supportedVendor} sous RouterOS ${routerOsMinimum} ou plus récent.`}
            placeholder="Choisir un modèle"
            value={otherModel ? OTHER_MODEL : model}
            display={
              otherModel
                ? `Autre modèle ${supportedVendor}`
                : model || undefined
            }
            error={otherModel ? undefined : errors.model?.message}
            onChange={(value) => {
              const other = value === OTHER_MODEL;
              setOtherModel(other);
              form.setValue("model", other ? "" : value, {
                shouldDirty: true,
                shouldValidate: !other,
              });
              if (other) form.clearErrors("model");
            }}
          >
            {routerModels.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
            <SelectItem value={OTHER_MODEL}>
              Autre modèle {supportedVendor}
            </SelectItem>
          </ChoiceField>
          {otherModel && (
            <FormField
              name="model"
              label="Modèle exact"
              description="Tel qu’indiqué sous l’appareil ou dans Winbox (System › RouterBOARD)."
            />
          )}
        </div>
        <FormField
          name="name"
          label="Nom du routeur"
          description="Pour le reconnaître dans votre espace. Ex. : Accueil – rez-de-chaussée."
        />
        <p className="text-sm text-muted-foreground">
          Étape suivante : Ronetz prépare un script d’installation à copier sur
          votre routeur.
        </p>
      </ValidatedForm>
      {mutation.isError && !conflict && (
        <div className="mt-4">
          <RouterFailure error={mutation.error} creating />
        </div>
      )}
    </SummaryCard>
  );
}
/**
 * Nom du routeur modifiable sur place, en champ empilé (gabarit des paramètres) :
 * « Enregistrer » ne s'active qu'après une modification ; en lecture seule sans droit.
 */
export function RouterNameField({
  active,
  router,
  expectedSite,
  editable,
}: {
  active: Membership;
  router: Router;
  expectedSite?: string;
  editable: boolean;
}) {
  const id = useId();
  const form = useForm<z.infer<typeof routerNameSchema>>({
    resolver: zodResolver(routerNameSchema),
    defaultValues: { name: router.name },
  });
  const mutation = useRouterChange(active);
  const error = form.formState.errors.name?.message;
  async function save(values: z.infer<typeof routerNameSchema>) {
    try {
      const result = await mutation.change({
        action: "rename",
        router,
        name: values.name,
        expectedSite,
      });
      if (!result) return;
      form.reset({ name: values.name });
      notificationManager.add({ title: "Nom mis à jour" });
    } catch (failure) {
      applyApiFieldErrors(failure, form, ["name"]);
    }
  }
  return (
    <form
      noValidate
      className="space-y-3"
      onSubmit={(event) => void form.handleSubmit(save)(event)}
    >
      <UnsavedChangesGuard
        when={editable && form.formState.isDirty}
        bypass={() => mutation.pending}
      />
      <SettingField
        label="Nom du routeur"
        description="Affiché dans Ronetz et dans vos rapports. 150 caractères maximum."
        htmlFor={id}
      >
        <Input
          id={id}
          readOnly={!editable}
          disabled={mutation.pending}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...form.register("name")}
        />
        {error && (
          <p id={`${id}-error`} className="mt-1.5 text-sm text-destructive">
            {error}
          </p>
        )}
      </SettingField>
      {editable && (
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          disabled={!form.formState.isDirty || mutation.pending}
        >
          {mutation.pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      )}
      {mutation.isError && !error && <RouterFailure error={mutation.error} />}
    </form>
  );
}
