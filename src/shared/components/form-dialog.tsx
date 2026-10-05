import type { ReactNode } from "react";
import { FormDialogContext, dialogFooterClass } from "./form-dialog-context";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

export function FormDialogContent({
  title,
  description,
  onClose,
  showCloseButton = true,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  showCloseButton?: boolean;
  children: ReactNode;
}) {
  return (
    <DialogContent
      showCloseButton={showCloseButton}
      className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 text-sm sm:max-w-[480px]"
    >
      <DialogHeader className="gap-1.5 px-6 pt-6 pb-2 pr-12">
        <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        {description && (
          <DialogDescription className="text-sm">
            {description}
          </DialogDescription>
        )}
      </DialogHeader>
      <FormDialogContext.Provider value={{ close: onClose }}>
        <div className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto px-6 pt-4 pb-6">
          {children}
        </div>
      </FormDialogContext.Provider>
    </DialogContent>
  );
}

/** Pied d'actions pour les formulaires écrits à la main (hors `ValidatedForm`). */
export function FormDialogFooter({ children }: { children: ReactNode }) {
  return <div className={dialogFooterClass}>{children}</div>;
}
