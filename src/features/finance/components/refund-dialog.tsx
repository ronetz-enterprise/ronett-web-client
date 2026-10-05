import {
  FormDialogContent,
  FormDialogFooter,
} from "@/shared/components/form-dialog";
import { useId, useState } from "react";
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
  formatMoney,
  newIdempotencyKey,
  type LedgerTransaction,
} from "../model/finance";
import { useRequestRefund } from "../queries/finance";

const reasons: Record<string, string> = {
  requested_by_customer: "Demande du client",
  duplicate: "Paiement en double",
  fraudulent: "Paiement frauduleux",
};

/**
 * Remboursement d'une vente, total par défaut. Un remboursement total coupe immédiatement
 * l'accès vendu ; un remboursement partiel le conserve.
 */
export function RefundDialog({
  active,
  sale,
  paymentId,
}: {
  active: Membership;
  sale: LedgerTransaction;
  paymentId: string;
}) {
  const id = useId();
  const mutation = useRequestRefund(active);
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(newIdempotencyKey);
  const [amount, setAmount] = useState(String(sale.grossAmount));
  const [reason, setReason] = useState("requested_by_customer");
  const [error, setError] = useState<string>();

  const value = Number(amount);
  const full = value === sale.grossAmount;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!Number.isInteger(value) || value <= 0 || value > sale.grossAmount) {
      setError(
        `Montant entier entre 1 et ${formatMoney(sale.grossAmount, sale.currency)}.`,
      );
      document.getElementById(`${id}-amount`)?.focus();
      return;
    }
    setError(undefined);
    try {
      await mutation.mutateAsync({
        paymentId,
        amount: value,
        reason,
        idempotencyKey: key,
      });
      setOpen(false);
      setKey(newIdempotencyKey());
    } catch {
      // Affiché dans le dialogue.
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (mutation.isPending) return;
        setOpen(next);
        if (!next) {
          mutation.reset();
          setError(undefined);
          setAmount(String(sale.grossAmount));
        }
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        Rembourser
      </DialogTrigger>
      <FormDialogContent
        title="Rembourser la vente"
        description={
          <>
            Vente de {formatMoney(sale.grossAmount, sale.currency)} du{" "}
            {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
              new Date(sale.createdAt),
            )}
            .
          </>
        }
        onClose={() => setOpen(false)}
        showCloseButton={!mutation.isPending}
      >
        <form onSubmit={submit} noValidate className="space-y-6">
          <div className="space-y-2">
            <label htmlFor={`${id}-amount`} className="text-sm font-medium">
              Montant remboursé ({sale.currency})
            </label>
            <Input
              id={`${id}-amount`}
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              aria-invalid={!!error}
              aria-describedby={`${id}-amount-help`}
            />
            <p
              id={`${id}-amount-help`}
              className={
                error
                  ? "text-sm text-destructive"
                  : "text-xs text-muted-foreground"
              }
            >
              {error ?? "Le remboursement partiel est possible."}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor={`${id}-reason`} className="text-sm font-medium">
              Motif
            </label>
            <Select
              value={reason}
              onValueChange={(next) => next && setReason(next)}
            >
              <SelectTrigger id={`${id}-reason`} className="w-full">
                <SelectValue>{() => reasons[reason]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(reasons).map(([code, label]) => (
                  <SelectItem key={code} value={code}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Alert>
            <AlertDescription>
              {full
                ? "Remboursement total : l’accès Internet vendu est coupé immédiatement."
                : "Remboursement partiel : l’accès Internet du client est conservé."}{" "}
              Le montant est repris sur votre solde disponible ; le client est
              crédité sous 3 à 5 jours.
            </AlertDescription>
          </Alert>

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
            <Button
              type="submit"
              variant="destructive"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Envoi…"
                : `Rembourser ${Number.isFinite(value) && value > 0 ? formatMoney(value, sale.currency) : ""}`}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </Dialog>
  );
}
