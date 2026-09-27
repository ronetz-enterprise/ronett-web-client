import { Link, Outlet } from "react-router";
export default function AuthLayout() {
  return (
    <div className="flex min-h-svh flex-col p-4">
      <header>
        <Link to="/" className="font-heading text-xl font-semibold">
          Ronet
        </Link>
      </header>
      <main className="m-auto w-full max-w-md space-y-6 rounded-xl border p-6">
        <Outlet />
      </main>
    </div>
  );
}
