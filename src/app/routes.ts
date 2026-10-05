import {
  index,
  layout,
  route,
  type RouteConfig,
} from "@react-router/dev/routes";
export default [
  layout("layouts/public-purchase-layout.tsx", [
    route("connect/:siteId", "../pages/public-purchase/public-offers-page.tsx"),
    route(
      "connect/:siteId/offers/:offerId",
      "../pages/public-purchase/purchase-review-page.tsx",
    ),
  ]),
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
  ]),
  layout("layouts/account-layout.tsx", [
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
      ],
    ),
  ]),
  layout(
    "router/guards/authenticated-route.tsx",
    { id: "authenticated-platform" },
    [
      // Administration plateforme : session authentifiee, puis permission
      // plateforme verifiee par le garde. Aucun contournement d'organisation.
      route("platform-admin", "router/guards/platform-admin-route.tsx", [
        layout("layouts/platform-admin-layout.tsx", [
          index("../pages/platform-admin/platform-dashboard-page.tsx"),
          route(
            "organizations",
            "../pages/platform-admin/platform-organizations-page.tsx",
          ),
          route(
            "organizations/:organizationId",
            "../pages/platform-admin/platform-organization-page.tsx",
          ),
          route("reseau", "../pages/platform-admin/platform-network-page.tsx"),
          route("audit", "../pages/platform-admin/platform-audit-page.tsx"),
          route("finance", "../pages/platform-admin/platform-finance-page.tsx"),
        ]),
      ]),
    ],
  ),
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
        route("access", "../pages/access/access-grants-page.tsx"),
        route("access/new", "../pages/access/manual-access-page.tsx"),
        route(
          "access/:accessGrantId",
          "../pages/access/access-grant-details-page.tsx",
        ),
        route("usage", "../pages/network-usage/network-usage-page.tsx"),
        route("finance", "../pages/finance/finance-page.tsx"),
        route("offers", "../pages/offers/offer-sites-page.tsx"),
        route("sites/:siteId/offers", "../pages/offers/offers-page.tsx"),
        route(
          "sites/:siteId/offers/new",
          "../pages/offers/offer-create-page.tsx",
        ),
        route("offers/:offerId", "../pages/offers/offer-details-page.tsx"),
        route(
          "offers/:offerId/prix",
          "../pages/offers/offer-settings-page.tsx",
        ),
        route(
          "offers/:offerId/presentation",
          "../pages/offers/offer-presentation-page.tsx",
        ),
        // Ancien onglet « Paramètres » : redirigé vers « Prix et accès ».
        route(
          "offers/:offerId/settings",
          "../pages/offers/offer-legacy-redirect.tsx",
          { id: "offer-legacy-tab" },
        ),
        // Anciennes adresses sous le site : redirigées vers /offers/:offerId.
        route(
          "sites/:siteId/offers/:offerId",
          "../pages/offers/offer-legacy-redirect.tsx",
          { id: "offer-legacy-detail" },
        ),
        route(
          "sites/:siteId/offers/:offerId/settings",
          "../pages/offers/offer-legacy-redirect.tsx",
          { id: "offer-legacy-settings" },
        ),
        route("sites", "../pages/sites/sites-page.tsx"),
        route("sites/new", "../pages/sites/site-create-page.tsx"),
        route("sites/:siteId", "../pages/sites/site-details-page.tsx"),
        route("sites/:siteId/routers", "../pages/sites/site-routers-page.tsx"),
        route(
          "sites/:siteId/settings",
          "../pages/sites/site-settings-page.tsx",
        ),
        route("organization", "../pages/organization/organization-page.tsx"),
        route(
          "settings",
          "../pages/organization-settings/organization-settings-redirect.tsx",
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
