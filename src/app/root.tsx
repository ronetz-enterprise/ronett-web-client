import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import { AppProviders } from "./providers/app-providers";
import { AppLoading } from "@/shared/components/feedback";
import NotFoundPage from "@/pages/public/not-found-page";
import ForbiddenPage from "@/pages/public/forbidden-page";
import UnexpectedErrorPage from "@/pages/public/unexpected-error-page";
import "./styles/app.css";
export function meta() {
  return [
    { title: "Ronet" },
    { name: "description", content: "Votre espace de gestion Wi-Fi." },
  ];
}
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
export default function App() {
  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  );
}
export function HydrateFallback() {
  return <AppLoading />;
}
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error) && error.status === 404)
    return <NotFoundPage />;
  if (isRouteErrorResponse(error) && error.status === 403)
    return <ForbiddenPage />;
  return <UnexpectedErrorPage error={error} />;
}
