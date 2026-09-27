import { useRef, useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/shared/ui/sheet";
import { TechnicalError } from "./feedback";
export function ConfirmDialog({
  trigger,
  title,
  description,
  onConfirm,
}: {
  trigger: string;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
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
    <Sheet
      open={open}
      onOpenChange={(value) => {
        if (!lock.current) {
          setOpen(value);
          setError(undefined);
        }
      }}
    >
      <SheetTrigger render={<Button variant="outline" />}>
        {trigger}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={!pending}
        className="mx-auto max-w-lg p-6"
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        {error !== undefined && <TechnicalError error={error} />}
        <div className="flex gap-2">
          <SheetClose render={<Button variant="outline" disabled={pending} />}>
            Annuler
          </SheetClose>
          <Button disabled={pending} onClick={() => void confirm()}>
            {pending ? "En cours…" : "Confirmer"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
