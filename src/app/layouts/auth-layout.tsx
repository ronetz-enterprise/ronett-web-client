import { Link, Outlet } from "react-router";
export default function AuthLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background px-4 py-8 sm:py-12">
      <div className="m-auto w-full max-w-110 space-y-8">
        <header>
          <Link
            to="/"
            className="inline-flex items-center gap-3 font-heading text-lg font-semibold"
          >
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              R
            </span>
            Ronetz
          </Link>
        </header>
        <main className="space-y-6 rounded-lg border bg-card p-5 text-card-foreground sm:p-6 [&_button[type=submit]]:w-full">
          <Outlet />
        </main>
        <p className="text-xs text-muted-foreground">
          Votre espace de gestion WiFi.
        </p>
      </div>
    </div>
  );
}
