import { FieldHeader } from "@/shared/components/field-header";
import { useFormDialog } from "@/shared/components/form-dialog-context";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useForm, useFormContext, useWatch } from "react-hook-form";
import { useNavigate, Link } from "react-router";
import { z } from "zod";
import type { Membership } from "@/features/memberships";
import type { Site } from "@/features/site";
import { FormField, ValidatedForm } from "@/shared/components/form";
import {
  zodResolver,
  applyApiFieldErrors,
} from "@/shared/components/form-utils";
import { notificationManager } from "@/shared/components/notifications";
import { Textarea } from "@/shared/ui/textarea";
import { UnitInput } from "@/shared/components/unit-input";
import {
  OfferUnitField,
  dataUnits,
  durationUnits,
  rateUnits,
} from "./offer-unit-field";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  createSchema,
  detailsSchema,
  priceSchema,
  policySchema,
  orderSchema,
  offerRoutes,
  LONG_MAX,
  type CreateValues,
  type Offer,
  type EditKind,
} from "../model/offer";
import { useOfferChange } from "../queries/offers";
import { OfferPanel, OfferFailure } from "./offer-shared";
import { FieldConfirm } from "./offer-field-confirm";
import { InlineEditContext } from "./offer-inline-edit-context";
const blank: CreateValues = {
  name: "",
  description: "",
  amount: "",
  validitySeconds: "",
  dataAllowanceBytes: "",
  downloadLimitBps: "",
  uploadLimitBps: "",
  maxConcurrentSessions: "",
  displayOrder: "0",
};
const baseSchema = z.object({
  name: z.string(),
  description: z.string(),
  amount: z.string(),
  validitySeconds: z.string(),
  dataAllowanceBytes: z.string(),
  downloadLimitBps: z.string(),
  uploadLimitBps: z.string(),
  maxConcurrentSessions: z.string(),
  displayOrder: z.string(),
});
type OfferTab = "general" | "access";
const offerTabs: OfferTab[] = ["general", "access"];
const offerTabLabels: Record<OfferTab, string> = {
  general: "Informations",
  access: "Conditions d’accès",
};
const offerTabFields: Record<OfferTab, (keyof CreateValues)[]> = {
  general: ["name", "description", "amount", "displayOrder"],
  access: [
    "validitySeconds",
    "dataAllowanceBytes",
    "maxConcurrentSessions",
    "downloadLimitBps",
    "uploadLimitBps",
  ],
};

/** Prix : la saisie et la devise sont deux zones distinctes, comme les autres champs à unité. */
function PriceField({
  currency,
  label = "Prix",
  description = "Le montant payé par le client.",
  after,
}: {
  after?: ReactNode;
  currency: string;
  label?: string;
  description?: string;
}) {
  const id = useId();
  const { register, formState } = useFormContext<CreateValues>();
  const error = formState.errors.amount?.message;
  return (
    <div className="space-y-2">
      <FieldHeader htmlFor={id} label={label} description={description} />
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <UnitInput
            id={id}
            inputMode="decimal"
            unit={currency}
            aria-invalid={!!error}
            aria-describedby={`${id}-error`}
            {...register("amount")}
          />
        </div>
        {after}
      </div>
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
const editParts: EditKind[] = ["details", "price", "policy", "order"];
const editPartFields: Record<EditKind, (keyof CreateValues)[]> = {
  details: ["name", "description"],
  price: ["amount"],
  policy: [
    "validitySeconds",
    "dataAllowanceBytes",
    "downloadLimitBps",
    "uploadLimitBps",
    "maxConcurrentSessions",
  ],
  order: ["displayOrder"],
};
function valuesFromOffer(offer?: Offer): CreateValues {
  return offer
    ? {
        name: offer.name,
        description: offer.description ?? "",
        amount: offer.price.amount,
        validitySeconds: offer.accessPolicy.validitySeconds,
        dataAllowanceBytes: offer.accessPolicy.dataAllowanceBytes ?? "",
        downloadLimitBps: offer.accessPolicy.downloadLimitBps ?? "",
        uploadLimitBps: offer.accessPolicy.uploadLimitBps ?? "",
        maxConcurrentSessions: offer.accessPolicy.maxConcurrentSessions,
        displayOrder: offer.displayOrder,
      }
    : blank;
}
export function OfferForm({
  active,
  site,
  currency,
  offer,
  kind,
  disabled = false,
  siteField,
  draft,
  parts,
}: {
  /** Modification en place d'une fiche : parties affichées, chaque champ validé seul. */
  parts?: EditKind[];
  /** Champ « Site » affiché en tête du formulaire de création en modale. */
  siteField?: ReactNode;
  /** Saisie en cours, conservée quand on change de site (le formulaire est recréé). */
  draft?: { current: Partial<CreateValues> };
  active: Membership;
  site: Site;
  currency: string;
  offer?: Offer;
  kind?: EditKind;
  disabled?: boolean;
}) {
  const mutation = useOfferChange(active, site.id);
  const navigate = useNavigate();
  const dialog = useFormDialog();
  const descriptionId = useId();
  const baseline = useRef(offer);
  // Création en modale : le formulaire est découpé en onglets pour rester court.
  // Création et modification complète en modale : même formulaire à onglets.
  const tabbed = !!dialog && !kind;
  // Fiche d'offre : chaque champ s'enregistre (✓) ou s'annule (✗) séparément.
  const inline = !!offer && !kind && !dialog;
  // Version par champ : remonte les champs à unité (état local) après une annulation.
  const [versions, setVersions] = useState<
    Partial<Record<keyof CreateValues, number>>
  >({});
  const [tab, setTab] = useState<OfferTab>("general");
  const schema =
    kind === "details"
      ? baseSchema.extend(detailsSchema.shape)
      : kind === "price"
        ? baseSchema.extend(priceSchema(currency).shape)
        : kind === "policy"
          ? baseSchema.extend(policySchema.shape)
          : kind === "order"
            ? baseSchema.extend(orderSchema.shape)
            : createSchema(currency);
  const form = useForm<CreateValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...valuesFromOffer(offer), ...draft?.current },
  });
  const values = useWatch({ control: form.control });
  if (draft) draft.current = values;
  const { errors, submitCount } = form.formState;
  const errorKey = Object.keys(errors).join();
  // Après un envoi refusé, on ouvre le premier onglet en erreur et on y place le focus.
  useEffect(() => {
    if (!tabbed || !submitCount) return;
    const first = offerTabs.find((value) =>
      offerTabFields[value].some((field) => form.getFieldState(field).error),
    );
    if (!first) return;
    setTab(first);
    pendingFocus.current =
      offerTabFields[first].find((name) => form.getFieldState(name).error) ??
      null;
  }, [tabbed, submitCount, errorKey, form]);
  // Le focus attend que l'onglet soit affiché : un champ masqué ne peut pas le recevoir.
  const pendingFocus = useRef<keyof CreateValues | null>(null);
  useEffect(() => {
    const field = pendingFocus.current;
    if (!field) return;
    pendingFocus.current = null;
    // Par le nom : les champs à unité ne sont pas enregistrés auprès de react-hook-form.
    const timer = setTimeout(() =>
      document.querySelector<HTMLElement>(`[name="${field}"]`)?.focus(),
    );
    return () => clearTimeout(timer);
  });
  const shows = (part: EditKind) =>
    parts ? parts.includes(part) : !kind || kind === part;
  const general = shows("details"),
    pricing = shows("price"),
    policy = shows("policy"),
    order = shows("order");
  async function commitFields(fields: (keyof CreateValues)[]) {
    if (!offer || !(await form.trigger(fields))) return;
    const part = editParts.find((p) => editPartFields[p].includes(fields[0]));
    if (!part) return;
    const base = baseline.current ?? offer;
    const current = form.getValues();
    // Les autres champs de la même partie gardent leur valeur enregistrée.
    const values = valuesFromOffer(base);
    for (const name of fields) values[name] = current[name];
    try {
      const result = await mutation.change({
        action: part,
        offer: base,
        values,
        currency,
      });
      if (!result) return;
      baseline.current = result;
      for (const name of fields)
        form.resetField(name, { defaultValue: values[name] });
      notificationManager.add({ title: "Modification enregistrée" });
    } catch (error) {
      applyApiFieldErrors(error, form, fields);
    }
  }
  function cancelFields(fields: (keyof CreateValues)[]) {
    for (const name of fields) form.resetField(name);
    mutation.reset();
    setVersions((current) => {
      const next = { ...current };
      for (const name of fields) next[name] = (next[name] ?? 0) + 1;
      return next;
    });
  }
  const confirm = (name: keyof CreateValues, label: string) => (
    <FieldConfirm fields={[name]} label={label} />
  );
  const policyFields = (
    <>
      <OfferUnitField
        key={`validitySeconds-${versions.validitySeconds ?? 0}`}
        after={confirm("validitySeconds", "durée d’accès")}
        name="validitySeconds"
        label="Durée d’accès"
        units={durationUnits}
        baseLabel="secondes"
        defaultUnit={1}
        max={31536000n}
        maxMessage="365 jours au maximum."
        description="Décomptée à partir de la première connexion."
      />
      <OfferUnitField
        key={`dataAllowanceBytes-${versions.dataAllowanceBytes ?? 0}`}
        after={confirm("dataAllowanceBytes", "volume de données")}
        name="dataAllowanceBytes"
        label="Volume de données"
        units={dataUnits}
        baseLabel="octets"
        defaultUnit={1}
        max={LONG_MAX}
        maxMessage="Valeur trop grande."
        unlimitable
        startUnlimited={!!offer}
      />
      <OfferUnitField
        key={`downloadLimitBps-${versions.downloadLimitBps ?? 0}`}
        after={confirm("downloadLimitBps", "vitesse de téléchargement")}
        name="downloadLimitBps"
        label="Vitesse de téléchargement"
        units={rateUnits}
        baseLabel="bit/s"
        defaultUnit={1}
        max={LONG_MAX}
        maxMessage="Valeur trop grande."
        unlimitable
        startUnlimited={!!offer}
      />
      <OfferUnitField
        key={`uploadLimitBps-${versions.uploadLimitBps ?? 0}`}
        after={confirm("uploadLimitBps", "vitesse d’envoi")}
        name="uploadLimitBps"
        label="Vitesse d’envoi"
        units={rateUnits}
        baseLabel="bit/s"
        defaultUnit={1}
        max={LONG_MAX}
        maxMessage="Valeur trop grande."
        unlimitable
        startUnlimited={!!offer}
      />
      <FormField
        name="maxConcurrentSessions"
        after={confirm("maxConcurrentSessions", "connexions simultanées")}
        label="Connexions simultanées"
        description="Nombre d’appareils connectés en même temps, de 1 à 32."
      />
    </>
  );
  async function submit(values: CreateValues) {
    form.clearErrors();
    try {
      let result: Offer | undefined;
      if (offer && !kind) {
        // Modification complète (modale de la fiche) : le serveur enregistre chaque partie
        // séparément ; on n'envoie que les parties modifiées, chacune sur la version
        // renvoyée par la précédente.
        const dirty = form.formState.dirtyFields;
        result = baseline.current ?? offer;
        for (const part of editParts) {
          if (!editPartFields[part].some((field) => dirty[field])) continue;
          const next = await mutation.change({
            action: part,
            offer: result,
            values,
            currency,
          });
          if (!next) return;
          result = baseline.current = next;
        }
      } else
        result = await mutation.change(
          offer && kind
            ? {
                action: kind,
                offer: baseline.current ?? offer,
                values,
                currency,
              }
            : { action: "create", values, currency },
        );
      if (!result) return;
      notificationManager.add({
        title: offer ? "Offre mise à jour" : "Brouillon créé",
      });
      if (!offer)
        await navigate(
          offerRoutes.detail(active.organizationId, site.id, result.offerId),
        );
      else {
        baseline.current = result;
        form.reset(valuesFromOffer(result));
        // Modification ouverte depuis la fiche : la modale se ferme.
        dialog?.close();
      }
    } catch (error) {
      applyApiFieldErrors(
        error,
        form,
        Object.keys(blank) as (keyof CreateValues)[],
      );
    }
  }
  return (
    <ValidatedForm
      form={form}
      onSubmit={submit}
      disabled={disabled || mutation.pending}
      submitLabel={offer ? "Enregistrer" : "Créer le brouillon"}
      hideActions={inline}
      footer={
        !offer ? (
          <Button
            variant={dialog ? "secondary" : "outline"}
            {...(dialog
              ? { onClick: dialog.close }
              : {
                  nativeButton: false,
                  role: "link",
                  render: (
                    <Link
                      to={offerRoutes.list(active.organizationId, site.id)}
                    />
                  ),
                })}
          >
            Annuler
          </Button>
        ) : dialog || inline ? undefined : (
          // Fragment toujours présent : les boutons restent alignés à droite.
          <>
            {form.formState.isDirty && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  baseline.current = offer;
                  form.reset(valuesFromOffer(offer));
                  mutation.reset();
                }}
              >
                Annuler les modifications
              </Button>
            )}
          </>
        )
      }
    >
      <InlineEditContext.Provider
        value={
          inline
            ? {
                commit: commitFields,
                cancel: cancelFields,
                pending: mutation.pending,
              }
            : null
        }
      >
        {tabbed ? (
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as OfferTab)}
          >
            <TabsList variant="line">
              {offerTabs.map((value) => (
                <TabsTrigger key={value} value={value}>
                  {offerTabLabels[value]}
                  {offerTabFields[value].some((field) => errors[field]) && (
                    <span
                      aria-label="contient une erreur"
                      className="size-1.5 rounded-full bg-destructive"
                    />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            {/* keepMounted : les champs des onglets masqués restent validés et envoyés. */}
            <TabsContent value="general" keepMounted className="space-y-6">
              {siteField}
              <FormField
                name="name"
                label="Nom de l’offre"
                description="Le nom que vos clients voient sur le portail."
                placeholder="Ex. Pass 1 heure"
              />
              <div className="space-y-2">
                <FieldHeader
                  htmlFor={descriptionId}
                  label="Description (facultatif)"
                  description="Une phrase pour aider le client à choisir."
                />
                <Textarea
                  id={descriptionId}
                  rows={3}
                  {...form.register("description")}
                  aria-invalid={!!errors.description}
                  aria-describedby={`${descriptionId}-error`}
                />
                <p
                  id={`${descriptionId}-error`}
                  className="text-sm text-destructive empty:hidden"
                  aria-live="polite"
                >
                  {errors.description?.message}
                </p>
              </div>
              <PriceField currency={currency} />
              {offer && (
                <FormField
                  name="displayOrder"
                  label="Position sur le portail"
                  description="Les plus petits numéros s’affichent en premier."
                />
              )}
            </TabsContent>
            <TabsContent value="access" keepMounted className="space-y-6">
              {policyFields}
            </TabsContent>
          </Tabs>
        ) : (
          <>
            {general && (
              <OfferPanel
                title="Détails"
                description="Ce que vos clients lisent sur le portail."
              >
                {siteField}
                <FormField
                  name="name"
                  label="Nom de l’offre"
                  after={confirm("name", "nom de l’offre")}
                />
                <div className="space-y-2">
                  <FieldHeader
                    htmlFor={descriptionId}
                    label="Description (facultatif)"
                    description="Une phrase pour aider le client à choisir."
                  />
                  <div className="flex items-start gap-2">
                    <Textarea
                      id={descriptionId}
                      rows={3}
                      className="min-w-0 flex-1"
                      {...form.register("description")}
                      aria-invalid={!!errors.description}
                      aria-describedby={`${descriptionId}-error`}
                    />
                    {confirm("description", "description")}
                  </div>
                  <p
                    id={`${descriptionId}-error`}
                    className="text-sm text-destructive empty:hidden"
                    aria-live="polite"
                  >
                    {errors.description?.message}
                  </p>
                </div>
              </OfferPanel>
            )}
            {pricing && (
              <OfferPanel
                title="Prix"
                description="Le montant payé par le client."
              >
                <PriceField
                  currency={currency}
                  label="Montant"
                  description=""
                  after={confirm("amount", "montant")}
                />
              </OfferPanel>
            )}
            {policy && (
              <OfferPanel
                title="Conditions d’accès"
                description="Ce que le client obtient après l’achat."
              >
                {policyFields}
              </OfferPanel>
            )}
            {order && (
              <OfferPanel
                title="Ordre sur le portail"
                description="Position de l’offre dans la liste vue par vos clients."
              >
                <FormField
                  name="displayOrder"
                  label="Position"
                  description="Les plus petits numéros s’affichent en premier."
                  after={confirm("displayOrder", "position")}
                />
              </OfferPanel>
            )}
          </>
        )}
      </InlineEditContext.Provider>
      {mutation.isError && <OfferFailure error={mutation.error} />}
    </ValidatedForm>
  );
}
