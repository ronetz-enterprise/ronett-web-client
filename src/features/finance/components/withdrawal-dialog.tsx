import {
  FormDialogContent,
  FormDialogFooter,
} from "@/shared/components/form-dialog";
import { useId, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoneySend01Icon } from "@hugeicons/core-free-icons";
import type { Membership } from "@/features/memberships";
import { toUserMessage } from "@/shared/errors/api-error";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogTrigger } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  APPROVAL_THRESHOLD,
  MINIMUM_WITHDRAWAL,
  formatMoney,
  networkLabels,
  newIdempotencyKey,
  type Balance,
} from "../model/finance";
import { useRequestWithdrawal } from "../queries/finance";

const PHONE = /^237[0-9]{9}$/;

type Errors = Partial<
  Record<"amount" | "msisdn" | "firstName" | "lastName", string>
>;

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Demande de retrait vers un portefeuille mobile money. Le serveur reste juge du solde, du
 * seuil d'approbation et du format ; le formulaire évite seulement les allers-retours inutiles.
 */
export function WithdrawalDialog({
  active,
  balance,
}: {
  active: Membership;
  balance: Balance;
}) {
  const id = useId();
  const mutation = useRequestWithdrawal(active);
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(newIdempotencyKey);
  const [amount, setAmount] = useState("");
  const [network, setNetwork] = useState("MTN");
  const [msisdn, setMsisdn] = useState("237");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const value = Number(amount);
  const tooLow = balance.availableAmount < MINIMUM_WITHDRAWAL;
  const needsApproval = Number.isFinite(value) && value > APPROVAL_THRESHOLD;

  function reset() {
    setAmount("");
    setMsisdn("237");
    setFirstName("");
    setLastName("");
    setErrors({});
    mutation.reset();
    setKey(newIdempotencyKey());
  }

  function validate(): Errors {
    const next: Errors = {};
    if (!Number.isInteger(value) || value < MINIMUM_WITHDRAWAL)
      next.amount = `Montant entier d’au moins ${formatMoney(MINIMUM_WITHDRAWAL, balance.currency)}.`;
    else if (value > balance.availableAmount)
      next.amount = `Au plus ${formatMoney(balance.availableAmount, balance.currency)} disponibles.`;
    if (!PHONE.test(msisdn.replace(/\s/g, "")))
      next.msisdn =
        "Numéro camerounais avec l’indicatif : 237 suivi de 9 chiffres.";
    if (!firstName.trim()) next.firstName = "Prénom requis.";
    if (!lastName.trim()) next.lastName = "Nom requis.";
    return next;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(`${id}-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    try {
      await mutation.mutateAsync({
        amount: value,
        currency: balance.currency,
        network,
        country: "CM",
        msisdn: msisdn.replace(/\s/g, ""),
        recipientFirstName: firstName.trim(),
        recipientLastName: lastName.trim(),
        idempotencyKey: key,
      });
      setOpen(false);
      reset();
    } catch {
      // Message affiché dans le dialogue ; la même clé rend un nouvel essai sans risque.
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (mutation.isPending) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button disabled={tooLow} />}>
        <HugeiconsIcon
          icon={MoneySend01Icon}
          data-icon="inline-start"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        Retirer des fonds
      </DialogTrigger>
      <FormDialogContent
        title="Retirer des fonds"
        description={
          <>
            {formatMoney(balance.availableAmount, balance.currency)}{" "}
            disponibles. Le versement est envoyé sur un portefeuille mobile
            money.
          </>
        }
        onClose={() => setOpen(false)}
        showCloseButton={!mutation.isPending}
      >
        <form onSubmit={submit} noValidate className="space-y-6">
          <Field
            id={`${id}-amount`}
            label={`Montant (${balance.currency})`}
            error={errors.amount}
            hint={`Minimum ${formatMoney(MINIMUM_WITHDRAWAL, balance.currency)}.`}
          >
            <Input
              id={`${id}-amount`}
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              aria-invalid={!!errors.amount}
              aria-describedby={
                errors.amount ? `${id}-amount-error` : `${id}-amount-hint`
              }
            />
          </Field>

          {needsApproval && (
            <Alert>
              <AlertDescription>
                Au-delà de {formatMoney(APPROVAL_THRESHOLD, balance.currency)},
                un administrateur Ronetz approuve le retrait avant le versement.
                Les fonds sont réservés dès maintenant.
              </AlertDescription>
            </Alert>
          )}

          <Field id={`${id}-network`} label="Opérateur">
            <Select
              value={network}
              onValueChange={(next) => next && setNetwork(next)}
            >
              <SelectTrigger id={`${id}-network`} className="w-full">
                <SelectValue>{() => networkLabels[network]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(networkLabels).map(([code, label]) => (
                  <SelectItem key={code} value={code}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            id={`${id}-msisdn`}
            label="Numéro du portefeuille"
            error={errors.msisdn}
            hint="Avec l’indicatif pays, par exemple 237 6XX XX XX XX."
          >
            <Input
              id={`${id}-msisdn`}
              inputMode="tel"
              autoComplete="tel"
              value={msisdn}
              onChange={(e) =>
                setMsisdn(e.target.value.replace(/[^0-9\s]/g, ""))
              }
              aria-invalid={!!errors.msisdn}
              aria-describedby={
                errors.msisdn ? `${id}-msisdn-error` : `${id}-msisdn-hint`
              }
            />
          </Field>

          <div className="grid gap-4">
            <Field
              id={`${id}-firstName`}
              label="Prénom du titulaire"
              error={errors.firstName}
            >
              <Input
                id={`${id}-firstName`}
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                aria-invalid={!!errors.firstName}
                aria-describedby={
                  errors.firstName ? `${id}-firstName-error` : undefined
                }
              />
            </Field>
            <Field
              id={`${id}-lastName`}
              label="Nom du titulaire"
              error={errors.lastName}
            >
              <Input
                id={`${id}-lastName`}
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                aria-invalid={!!errors.lastName}
                aria-describedby={
                  errors.lastName ? `${id}-lastName-error` : undefined
                }
              />
            </Field>
          </div>

          {mutation.isError && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>
                {toUserMessage(mutation.error)}
              </AlertDescription>
            </Alert>
          )}

          <FormDialogFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={mutation.isPending}
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Envoi…"
                : needsApproval
                  ? "Soumettre pour approbation"
                  : "Confirmer le retrait"}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </Dialog>
  );
}
