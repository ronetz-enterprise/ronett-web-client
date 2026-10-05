import { useRef, useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { TechnicalError } from "./feedback";

/**
 * Confirmation d'une action à conséquence, centrée et modale (`role="alertdialog"`).
 * L'erreur éventuelle s'affiche dans la boîte, qui reste ouverte pour réessayer ;
 * elle ne se ferme pas pendant l'opération.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  onConfirm,
  confirmLabel = "Confirmer",
  destructive = false,
}: {
  trigger: string;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
  /** Verbe de l'action (« Révoquer », « Annuler le retrait ») plutôt que « Confirmer ». */
  confirmLabel?: string;
  destructive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  const lock = useRef(false);

  async function confirm() {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setError(undefined);
    try {
      await onConfirm();
      setOpen(false);
    } catch (failure) {
      setError(failure);
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (lock.current) return;
        setOpen(value);
        setError(undefined);
      }}
    >
      <AlertDialogTrigger render={<Button variant="outline" />}>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error !== undefined && <TechnicalError error={error} />}
        <AlertDialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Annuler
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            aria-busy={pending}
            onClick={() => void confirm()}
          >
            {pending ? "En cours…" : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
