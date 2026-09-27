import {
  index,
  layout,
  route,
  type RouteConfig,
} from "@react-router/dev/routes";
export default [
  layout("layouts/public-layout.tsx", [
    index("../pages/public/home-page.tsx"),
    route("public", "../pages/public/portal-page.tsx"),
    route("forbidden", "../pages/public/forbidden-page.tsx"),
  ]),
  layout("layouts/auth-layout.tsx", [
    route("auth", "../pages/auth/login-page.tsx", { id: "auth-index" }),
    route("auth/login", "../pages/auth/login-page.tsx"),
    route("auth/register", "../pages/auth/register-page.tsx"),
    route("onboarding", "../pages/onboarding/onboarding-page.tsx"),
  ]),
  route("app/:organizationId", "layouts/app-layout.tsx", [
    index("../pages/dashboard/dashboard-page.tsx"),
    route("organization", "../pages/organization/organization-page.tsx"),
  ]),
  route("platform-admin", "layouts/platform-admin-layout.tsx", [
    index("../pages/platform-admin/platform-admin-page.tsx"),
  ]),
  ...(process.env.NODE_ENV !== "production"
    ? [route("__dev/socle", "../pages/public/diagnostics-page.tsx")]
    : []),
  route("*", "../pages/public/not-found-page.tsx"),
] satisfies RouteConfig;
