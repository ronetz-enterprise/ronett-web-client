import { FieldHeader } from "@/shared/components/field-header";
import { UnitInput } from "@/shared/components/unit-input";
import { UnlimitedSwitch } from "@/shared/components/unlimited-switch";
import { useFormDialog } from "@/shared/components/form-dialog-context";
import { useId, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm, type UseFormReturn } from "react-hook-form";
import type { Membership } from "@/features/memberships";
import { useSites } from "@/features/site";
import {
  EmptyState,
  PageHeader,
  PageLoading,
} from "@/shared/components/feedback";
import { ValidatedForm } from "@/shared/components/form";
import { zodResolver } from "@/shared/components/form-utils";
import { SettingsSection } from "@/shared/components/settings-layout";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { ApiError } from "@/shared/errors/api-error";
import {
  MANUAL_SUBJECT_TYPES,
  dataUnits,
  durationUnits,
  manualAccessDefaults,
  manualAccessSchema,
  type IssuedCredential,
  type ManualAccessValues,
} from "../model/manual-access";
import { accessSubjectLabels, accessRoutes } from "../model/access-grant";
import { accessPermissions } from "../permissions/access-permissions";
import { useManualAccess } from "../mutations/manual-access";
import { AccessBreadcrumb, AccessFailure } from "./access-shared";
import { AccessPolicyEnforcement } from "./access-policy-enforcement";
import { IssuedCredentialPanel } from "./issued-credential-panel";
import { RemoteCredentialPanel } from "./remote-credential-panel";

type Form = UseFormReturn<ManualAccessValues>;
type TextField =
  | "validityAmount"
  | "dataAmount"
  | "downloadMbps"
  | "uploadMbps"
  | "maxConcurrentSessions"
  | "subjectId";

/** Champ empilé du formulaire : libellé, aide, contrôle, erreur. */
function Field({
  id,
  label,
  description,
  error,
  children,
  unlimited,
}: {
  /** Interrupteur « Illimité » : remplace la convention « champ vide = illimité ». */
  unlimited?: { checked: boolean; onChange: (checked: boolean) => void };
  id: string;
  label: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const dialog = useFormDialog();
  return (
    <div className="space-y-2">
      <FieldHeader
        htmlFor={id}
        label={label}
        description={unlimited?.checked ? undefined : description}
        descriptionId={`${id}-description`}
        aside={
          unlimited && (
            <UnlimitedSwitch
              label={label}
              checked={unlimited.checked}
              onChange={unlimited.onChange}
            />
          )
        }
      />
      {!unlimited?.checked && (
        <div className={dialog ? undefined : "max-w-sm"}>{children}</div>
      )}
      <p
        id={`${id}-error`}
        aria-live="polite"
        className="text-sm text-destructive empty:hidden"
      >
        {error}
      </p>
    </div>
  );
}

/** Champ de saisie lié au formulaire, avec une unité affichée à droite. */
function NumberInput({
  form,
  name,
  id,
  placeholder,
  suffix,
  text = false,
}: {
  form: Form;
  name: TextField;
  id: string;
  placeholder?: string;
  suffix?: string;
  /** Saisie libre (référence) plutôt que numérique. */
  text?: boolean;
}) {
  const props = {
    id,
    inputMode: text ? undefined : ("numeric" as const),
    placeholder,
    "aria-invalid": !!form.formState.errors[name],
    "aria-describedby": `${id}-description ${id}-error`,
    ...form.register(name),
  };
  return suffix ? <UnitInput {...props} unit={suffix} /> : <Input {...props} />;
}

/** Nombre suivi d'un choix d'unité (durée en minutes/heures/jours, volume en Mo/Go). */
function AmountWithUnit<U extends string>({
  form,
  name,
  unitName,
  units,
  id,
  placeholder,
}: {
  form: Form;
  name: TextField;
  unitName: "validityUnit" | "dataUnit";
  units: Record<U, { label: string }>;
  id: string;
  placeholder?: string;
}) {
  const unit = form.watch(unitName) as U;
  return (
    <UnitInput
      id={id}
      inputMode="numeric"
      placeholder={placeholder}
      aria-invalid={!!form.formState.errors[name]}
      aria-describedby={`${id}-description ${id}-error`}
      {...form.register(name)}
      unit={unit}
      units={(Object.keys(units) as U[]).map((key) => ({
        value: key,
        label: units[key].label,
      }))}
      onUnitChange={(value) =>
        form.setValue(unitName, value as never, { shouldValidate: true })
      }
    />
  );
}

export function ManualAccessForm({ active }: { active: Membership }) {
  const sites = useSites(active);
  const mutation = useManualAccess(active);
  const navigate = useNavigate();
  const dialog = useFormDialog();
  const id = useId();
  // Résultat de la création, gardé en mémoire le temps de l'écran : le mot de passe
  // n'entre dans aucun cache et disparaît à la navigation.
  const [issued, setIssued] = useState<{
    created: boolean;
    credential: IssuedCredential | null;
    retrievalToken: string | null;
    grantId: string;
  } | null>(null);
  const form = useForm<ManualAccessValues>({
    resolver: zodResolver(manualAccessSchema),
    defaultValues: { ...manualAccessDefaults },
  });
  const permissions = accessPermissions(active);
  const activeSites = (sites.data ?? []).filter(
    (site) => site.status === "ACTIVE",
  );
  const subjectType = form.watch("subjectType");
  // Rien n'est illimité par défaut : l'interrupteur s'active explicitement.
  const [unlimited, setUnlimited] = useState({
    dataAmount: false,
    downloadMbps: false,
    uploadMbps: false,
  });
  const limitSwitch = (name: keyof typeof unlimited) => ({
    checked: unlimited[name],
    onChange: (checked: boolean) => {
      setUnlimited((current) => ({ ...current, [name]: checked }));
      if (checked) form.setValue(name, "", { shouldValidate: true });
    },
  });
  const errors = form.formState.errors;

  if (!permissions.canCreateManualAccess)
    return <AccessFailure error={new ApiError("http", 403)} />;
  if (sites.isPending) return <PageLoading variant="form" />;
  if (!sites.data)
    return (
      <AccessFailure error={sites.error} retry={() => void sites.refetch()} />
    );
  if (!activeSites.length)
    return (
      <EmptyState
        title="Aucun site actif"
        description="Un accès est toujours rattaché à un site actif. Créez ou réactivez un site avant de créer un accès."
      />
    );

  if (issued) {
    const acknowledge = () => {
      setIssued(null);
      mutation.rotate();
      void navigate(accessRoutes.detail(active.organizationId, issued.grantId));
    };
    return (
      <div className="space-y-6">
        {!dialog && (
          <PageHeader
            title={issued.created ? "Accès créé" : "Cet accès existe déjà"}
            breadcrumb={
              <AccessBreadcrumb
                organizationId={active.organizationId}
                current="Créer un accès"
              />
            }
          />
        )}
        {issued.credential ? (
          <IssuedCredentialPanel
            credential={issued.credential}
            onAcknowledge={acknowledge}
          />
        ) : issued.created && issued.retrievalToken ? (
          <RemoteCredentialPanel
            accessGrantId={issued.grantId}
            retrievalToken={issued.retrievalToken}
            onAcknowledge={acknowledge}
          />
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertTitle>
                Le mot de passe ne peut pas être réaffiché
              </AlertTitle>
              <AlertDescription>
                Cet accès avait déjà été créé (le formulaire a été envoyé deux
                fois). Le mot de passe n’est affiché qu’à la première création.
              </AlertDescription>
            </Alert>
            <Button
              nativeButton={false}
              role="link"
              render={
                <Link
                  to={accessRoutes.detail(
                    active.organizationId,
                    issued.grantId,
                  )}
                />
              }
            >
              Voir l’accès
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={dialog ? "space-y-0" : "space-y-6"}>
      {!dialog && (
        <PageHeader
          title="Créer un accès"
          breadcrumb={
            <AccessBreadcrumb
              organizationId={active.organizationId}
              current="Créer un accès"
            />
          }
        />
      )}
      <p className={dialog ? "sr-only" : "text-sm text-muted-foreground"}>
        Offrez un accès à un client ou à votre équipe, sans passer par le
        portail. L’identifiant et le mot de passe s’affichent juste après la
        création.
      </p>

      <ValidatedForm
        form={form}
        submitLabel="Créer l’accès"
        disabled={mutation.pending}
        footer={
          dialog && (
            <Button variant="secondary" onClick={dialog.close}>
              Annuler
            </Button>
          )
        }
        onSubmit={async (values) => {
          // Interrupteur coupé mais champ vide : une limite est attendue.
          const missing = (
            Object.keys(unlimited) as (keyof typeof unlimited)[]
          ).filter((name) => !unlimited[name] && values[name].trim() === "");
          for (const name of missing)
            form.setError(name, { message: "Indiquez une valeur." });
          if (missing.length) return;
          const result = await mutation.issue(values);
          if (!result.applied || !result.result) return;
          setIssued({
            created: result.result.created,
            credential: result.result.credentialDelivery,
            retrievalToken: result.result.retrievalToken,
            grantId: result.result.grant.accessGrantId,
          });
        }}
      >
        <div className={dialog ? "space-y-6" : "space-y-10 pb-2"}>
          <SettingsSection title="Pour qui ?">
            <div className="space-y-6">
              <Field
                id={`${id}-site`}
                label="Site"
                description="Le client se connectera au WiFi de ce site."
                error={errors.siteId?.message}
              >
                <Select
                  value={form.watch("siteId")}
                  onValueChange={(value) =>
                    form.setValue("siteId", value ?? "", {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id={`${id}-site`} className="w-full">
                    <SelectValue placeholder="Choisir un site">
                      {(value: string) =>
                        activeSites.find((site) => site.id === value)?.name ??
                        "Choisir un site"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {activeSites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field
                id={`${id}-subject`}
                label="Utilisé par"
                description={
                  subjectType === "ANONYMOUS"
                    ? "Le cas le plus courant : un client qui se connecte avec l’identifiant et le mot de passe que vous lui donnez."
                    : "L’accès est lié à un compte ou à un appareil précis."
                }
              >
                <Select
                  value={subjectType}
                  onValueChange={(value) =>
                    form.setValue(
                      "subjectType",
                      (value ??
                        "ANONYMOUS") as ManualAccessValues["subjectType"],
                      { shouldValidate: true },
                    )
                  }
                >
                  <SelectTrigger id={`${id}-subject`} className="w-full">
                    <SelectValue>
                      {accessSubjectLabels[subjectType] ?? subjectType}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MANUAL_SUBJECT_TYPES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {accessSubjectLabels[value] ?? value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {subjectType !== "ANONYMOUS" && (
                <Field
                  id={`${id}-subject-id`}
                  label="Référence du compte ou de l’appareil"
                  description="La référence fournie par Ronetz pour ce compte, cet abonné ou cet appareil."
                  error={errors.subjectId?.message}
                >
                  <NumberInput
                    form={form}
                    name="subjectId"
                    id={`${id}-subject-id`}
                    text
                  />
                </Field>
              )}
            </div>
          </SettingsSection>

          <SettingsSection
            title="Conditions"
            description="Ce que comprend l’accès. Laissez vide ce qui doit être illimité."
          >
            <div className="space-y-6">
              <Field
                id={`${id}-validity`}
                label="Durée"
                description="Le décompte commence dès la création. 365 jours maximum."
                error={errors.validityAmount?.message}
              >
                <AmountWithUnit
                  form={form}
                  name="validityAmount"
                  unitName="validityUnit"
                  units={durationUnits}
                  id={`${id}-validity`}
                />
              </Field>
              <Field
                id={`${id}-data`}
                label="Volume de données"
                unlimited={limitSwitch("dataAmount")}
                error={errors.dataAmount?.message}
              >
                <AmountWithUnit
                  form={form}
                  name="dataAmount"
                  unitName="dataUnit"
                  units={dataUnits}
                  id={`${id}-data`}
                />
              </Field>
              <Field
                id={`${id}-download`}
                label="Vitesse de téléchargement"
                unlimited={limitSwitch("downloadMbps")}
                error={errors.downloadMbps?.message}
              >
                <NumberInput
                  form={form}
                  name="downloadMbps"
                  id={`${id}-download`}
                  suffix="Mbit/s"
                />
              </Field>
              <Field
                id={`${id}-upload`}
                label="Vitesse d’envoi"
                unlimited={limitSwitch("uploadMbps")}
                error={errors.uploadMbps?.message}
              >
                <NumberInput
                  form={form}
                  name="uploadMbps"
                  id={`${id}-upload`}
                  suffix="Mbit/s"
                />
              </Field>
              <Field
                id={`${id}-sessions`}
                label="Appareils connectés en même temps"
                description="Entre 1 et 32."
                error={errors.maxConcurrentSessions?.message}
              >
                <NumberInput
                  form={form}
                  name="maxConcurrentSessions"
                  id={`${id}-sessions`}
                />
              </Field>
              <AccessPolicyEnforcement />
            </div>
          </SettingsSection>

          {errors.root && (
            <Alert variant="destructive">
              <AlertTitle>L’accès n’a pas pu être créé</AlertTitle>
              <AlertDescription>
                <p>{errors.root.message}</p>
                {mutation.error instanceof ApiError &&
                  mutation.error.correlationId && (
                    <p className="mt-2 text-xs">
                      Référence pour le support :{" "}
                      <code className="break-all">
                        {mutation.error.correlationId}
                      </code>
                    </p>
                  )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </ValidatedForm>
    </div>
  );
}
