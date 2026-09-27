import { Link, Outlet } from "react-router";
import { ErrorBoundary } from "@/shared/components/error-boundary";
export default function PublicLayout() {
  return (
    <div className="min-h-svh">
      <header className="border-b p-4">
        <Link to="/" className="font-heading text-xl font-semibold">
          Ronet
        </Link>
      </header>
      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-8"
      >
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
