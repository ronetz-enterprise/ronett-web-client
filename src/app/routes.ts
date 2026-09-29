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
    layout("router/guards/public-only-route.tsx", [
      route("auth", "../pages/auth/login-page.tsx", { id: "auth-index" }),
      route("auth/login", "../pages/auth/login-page.tsx"),
      route("auth/register", "../pages/auth/register-page.tsx"),
      route("auth/session-expired", "../pages/auth/session-expired-page.tsx"),
    ]),
    layout(
      "router/guards/authenticated-route.tsx",
      { id: "authenticated-account" },
      [
        route(
          "onboarding",
          "../pages/onboarding/create-organization-page.tsx",
          {
            id: "onboarding-index",
          },
        ),
        route(
          "onboarding/organization",
          "../pages/onboarding/create-organization-page.tsx",
        ),
        route(
          "onboarding/status",
          "../pages/onboarding/onboarding-status-page.tsx",
        ),
        route(
          "organizations/select",
          "../pages/organization/select-organization-page.tsx",
        ),
        route("app", "../pages/organization/select-organization-page.tsx", {
          id: "unselected-organization",
        }),
        route("account", "../pages/auth/account-page.tsx"),
        // Platform administration remains outside this sprint; no tenant bypass.
        route("platform-admin", "../pages/public/forbidden-page.tsx", {
          id: "platform-unavailable",
        }),
      ],
    ),
  ]),
  layout("router/guards/authenticated-route.tsx", [
    route("app/:organizationId", "router/guards/organization-route.tsx", [
      layout("layouts/app-layout.tsx", [
        index("../pages/dashboard/dashboard-page.tsx"),
        route("routers", "../pages/routers/routers-page.tsx"),
        route("routers/new", "../pages/routers/router-create-page.tsx"),
        route("routers/:routerId", "../pages/routers/router-details-page.tsx"),
        route(
          "routers/:routerId/settings",
          "../pages/routers/router-settings-page.tsx",
        ),
        route("sites", "../pages/sites/sites-page.tsx"),
        route("sites/new", "../pages/sites/site-create-page.tsx"),
        route("sites/:siteId", "../pages/sites/site-details-page.tsx"),
        route(
          "sites/:siteId/settings",
          "../pages/sites/site-settings-page.tsx",
        ),
        route("organization", "../pages/organization/organization-page.tsx"),
        route(
          "settings",
          "../pages/organization-settings/organization-settings-page.tsx",
          { id: "settings-index" },
        ),
        route(
          "settings/general",
          "../pages/organization-settings/organization-settings-page.tsx",
        ),
        route(
          "settings/members",
          "../pages/organization-settings/organization-members-page.tsx",
        ),
      ]),
    ]),
  ]),
  ...(process.env.NODE_ENV !== "production"
    ? [route("__dev/socle", "../pages/public/diagnostics-page.tsx")]
    : []),
  route("*", "../pages/public/not-found-page.tsx"),
] satisfies RouteConfig;
