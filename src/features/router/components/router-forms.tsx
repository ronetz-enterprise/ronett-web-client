import { useId } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Membership } from "@/features/memberships";
import { useSites, siteRoutes } from "@/features/site";
import {
  PageHeader,
  PageLoading,
  EmptyState,
} from "@/shared/components/feedback";
import { SummaryCard } from "@/shared/components/page-patterns";
import {
  ValidatedForm,
  FormField,
  zodResolver,
  applyApiFieldErrors,
} from "@/shared/components/form";
import { notificationManager } from "@/shared/components/notifications";
import { ApiError } from "@/shared/errors/api-error";
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
  type Router,
  type RouterCreateValues,
} from "../model/router";
import { useRouterChange } from "../queries/routers";
import {
  RouterBreadcrumb,
  RouterFailure,
  transientRouterError,
} from "./router-shared";

export function RouterCreate({
  active,
  siteId,
}: {
  active: Membership;
  siteId?: string;
}) {
  const sites = useSites(active);
  const mutation = useRouterChange(active);
  const navigate = useNavigate();
  const id = useId();
  const form = useForm<RouterCreateValues>({
    resolver: zodResolver(routerCreateSchema),
    defaultValues: { name: "", vendor: "", model: "", siteId: siteId ?? "" },
  });
  const selectedId = form.watch("siteId");
  if (!routerCapabilities(active).canCreateRouter)
    return <RouterFailure error={new ApiError("http", 403)} />;
  if (siteId && !z.uuid().safeParse(siteId).success)
    return <RouterFailure error={new ApiError("http", 404)} />;
  if (sites.isPending) return <PageLoading />;
  if (!sites.data || (sites.isError && !transientRouterError(sites.error)))
    return (
      <RouterFailure error={sites.error} retry={() => void sites.refetch()} />
    );
  if (siteId && !sites.data.some((site) => site.id === siteId))
    return <RouterFailure error={new ApiError("http", 404)} />;
  const choices = sites.data.filter((site) => site.status === "ACTIVE");
  const selected = choices.find((site) => site.id === selectedId);
  async function save(values: RouterCreateValues) {
    try {
      const router = await mutation.change({ action: "create", values });
      if (!router) return;
      notificationManager.add({
        title: "Routeur déclaré",
        description: "Le provisioning n’a pas encore été demandé.",
      });
      void navigate(
        routerRoutes.detail(
          active.organizationId,
          router.id,
          router.siteId ?? undefined,
        ),
      );
    } catch (error) {
      applyApiFieldErrors(error, form, ["name", "vendor", "model", "siteId"]);
    }
  }
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Déclarer un routeur"
        description={`Ajouter un équipement à un site de ${active.organizationName}.`}
        breadcrumb={
          <RouterBreadcrumb
            org={active.organizationId}
            current="Nouveau routeur"
          />
        }
      />
      {!choices.length || (siteId && !selected) ? (
        <EmptyState
          title="Aucun site actif disponible"
          description="Le rattachement exige un site actif de cette organisation."
          actions={
            <Button
              variant="outline"
              render={<Link to={siteRoutes.list(active.organizationId)} />}
            >
              Consulter les sites
            </Button>
          }
        />
      ) : (
        <SummaryCard title="Identité de l’équipement">
          <ValidatedForm
            form={form}
            onSubmit={save}
            disabled={mutation.pending || sites.isFetching}
            submitLabel="Déclarer le routeur"
          >
            <FormField
              name="name"
              label="Nom du routeur"
              description="150 caractères maximum."
            />
            <div className="space-y-2">
              <label
                id={`${id}-label`}
                htmlFor={id}
                className="text-sm font-medium"
              >
                Site de rattachement
              </label>
              <Select
                value={selectedId || null}
                disabled={!!siteId}
                onValueChange={(value) =>
                  form.setValue("siteId", value ?? "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger
                  id={id}
                  aria-labelledby={`${id}-label`}
                  aria-invalid={!!form.formState.errors.siteId}
                  aria-describedby={`${id}-error`}
                  className="w-full"
                >
                  <SelectValue placeholder="Choisir un site actif">
                    {selected?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {choices.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name} · {site.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p
                id={`${id}-error`}
                className="text-sm text-destructive"
                aria-live="polite"
              >
                {form.formState.errors.siteId?.message}
              </p>
              {siteId && (
                <p className="text-sm text-muted-foreground">
                  Site confirmé depuis votre point d’entrée. Le rattachement
                  sera vérifié à nouveau à l’envoi.
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                name="vendor"
                label="Constructeur"
                description="Nom du constructeur, 100 caractères maximum."
              />
              <FormField
                name="model"
                label="Modèle"
                description="Désignation de l’équipement, 150 caractères maximum."
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Déclarer un équipement ne confirme pas sa compatibilité ni son
              installation. Aucun secret réseau n’est demandé.
            </p>
          </ValidatedForm>
          {mutation.isError && (
            <div className="mt-4">
              <RouterFailure error={mutation.error} />
            </div>
          )}
        </SummaryCard>
      )}
      <Button
        variant="outline"
        disabled={mutation.pending}
        render={
          <Link
            to={
              siteId
                ? siteRoutes.detail(active.organizationId, siteId)
                : routerRoutes.list(active.organizationId)
            }
          />
        }
      >
        Annuler
      </Button>
    </div>
  );
}
export function RouterRename({
  active,
  router,
  expectedSite,
}: {
  active: Membership;
  router: Router;
  expectedSite?: string;
}) {
  const form = useForm<z.infer<typeof routerNameSchema>>({
    resolver: zodResolver(routerNameSchema),
    defaultValues: { name: router.name },
  });
  const mutation = useRouterChange(active),
    navigate = useNavigate();
  return (
    <SummaryCard
      title="Nom du routeur"
      description="Le site, le constructeur et le modèle ne sont pas modifiables dans cette version."
    >
      <div className="space-y-4">
        <ValidatedForm
          form={form}
          submitLabel="Enregistrer le nom"
          disabled={mutation.pending}
          onSubmit={async (values) => {
            try {
              const result = await mutation.change({
                action: "rename",
                router,
                name: values.name,
                expectedSite,
              });
              if (!result) return;
              notificationManager.add({ title: "Nom mis à jour" });
              void navigate(
                routerRoutes.detail(
                  active.organizationId,
                  router.id,
                  expectedSite,
                ),
              );
            } catch (error) {
              applyApiFieldErrors(error, form, ["name"]);
            }
          }}
        >
          <FormField
            name="name"
            label="Nom du routeur"
            description="150 caractères maximum."
          />
        </ValidatedForm>
        {mutation.isError && <RouterFailure error={mutation.error} />}
        <Button
          variant="outline"
          disabled={mutation.pending}
          render={
            <Link
              to={routerRoutes.detail(
                active.organizationId,
                router.id,
                expectedSite,
              )}
            />
          }
        >
          Annuler
        </Button>
      </div>
    </SummaryCard>
  );
}
