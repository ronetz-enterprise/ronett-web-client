import { Link } from "react-router";
import { cn } from "@/shared/utils/cn";

/**
 * Fond plein écran (`--auth-backdrop-image` pour une photo, sinon dégradé) et
 * carte flottante. `align="end"` place la carte à droite sur grand écran.
 */
export function AuthShell({
  align = "center",
  children,
}: {
  align?: "center" | "end";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-svh items-center justify-center bg-background bg-cover bg-center px-4 py-8 sm:py-12",
        align === "end" && "lg:justify-end lg:px-16 xl:px-24",
      )}
      style={{
        backgroundImage: "var(--auth-backdrop-image), var(--auth-backdrop)",
      }}
    >
      <main className="w-full max-w-110 space-y-6 rounded-xl bg-card p-6 text-card-foreground shadow-elevated sm:p-10 [&_[data-slot=page-header]]:border-b-0 [&_[data-slot=page-header]]:pb-0 [&_[data-slot=input]]:h-11 [&_[data-slot=input]]:bg-card [&_[data-slot=input]]:px-3 [&_button[type=submit]]:h-11 [&_button[type=submit]]:w-full">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 font-heading text-base font-semibold"
        >
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            R
          </span>
          Ronetz
        </Link>
        {children}
      </main>
    </div>
  );
}
