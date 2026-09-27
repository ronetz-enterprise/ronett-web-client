import { Toast } from "@base-ui/react/toast";
import { Button } from "@/shared/ui/button";
export const notificationManager = Toast.createToastManager();
function NotificationList() {
  const { toasts } = Toast.useToastManager();
  return (
    <Toast.Portal>
      <Toast.Viewport className="fixed right-4 bottom-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            toast={toast}
            className="rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg"
          >
            <Toast.Title className="font-semibold" />
            <Toast.Description />
            <Toast.Close render={<Button variant="ghost" />}>
              Fermer
            </Toast.Close>
          </Toast.Root>
        ))}
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
