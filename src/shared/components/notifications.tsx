import { Toast } from "@base-ui/react/toast";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/cn";

export const notificationManager = Toast.createToastManager();

type Kind = "success" | "error" | "info";

const kinds: Record<
  Kind,
  { icon: typeof InformationCircleIcon; tone: string }
> = {
  success: {
    icon: CheckmarkCircle02Icon,
    tone: "bg-success text-success-foreground",
  },
  error: { icon: Alert02Icon, tone: "bg-danger text-danger-foreground" },
  info: { icon: InformationCircleIcon, tone: "bg-info text-info-foreground" },
};

/**
 * Raccourcis typés. Succès et information disparaissent seuls ; une erreur reste affichée
 * jusqu'à sa fermeture, pour ne jamais passer inaperçue.
 */
export const notify = {
  success: (title: string, description?: string) =>
    notificationManager.add({
      title,
      description,
      type: "success",
      timeout: 4000,
    }),
  info: (title: string, description?: string) =>
    notificationManager.add({
      title,
      description,
      type: "info",
      timeout: 5000,
    }),
  error: (title: string, description?: string) =>
    notificationManager.add({
      title,
      description,
      type: "error",
      timeout: 0,
      priority: "high",
    }),
};

function NotificationList() {
  const { toasts } = Toast.useToastManager();
  return (
    <Toast.Portal>
      <Toast.Viewport className="fixed right-4 bottom-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((toast) => {
          // Sans type explicite (appels historiques), un toast est un succès.
          const kind =
            kinds[(toast.type as Kind) ?? "success"] ?? kinds.success;
          return (
            <Toast.Root
              key={toast.id}
              toast={toast}
              className="flex items-start gap-3 rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full",
                  kind.tone,
                )}
              >
                <HugeiconsIcon
                  icon={kind.icon}
                  strokeWidth={1.75}
                  className="size-4"
                />
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <Toast.Title className="text-sm font-semibold" />
                <Toast.Description className="text-sm text-muted-foreground" />
              </div>
              <Toast.Close
                render={<Button variant="ghost" size="icon-sm" />}
                aria-label="Fermer la notification"
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </Toast.Close>
            </Toast.Root>
          );
        })}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Toast.Provider toastManager={notificationManager}>
      {children}
      <NotificationList />
    </Toast.Provider>
  );
}
