// Development/test-only server simulation. Never imported into production bundles.
// Données d'exploitation déterministes pour la recette visuelle (Lot 9) : sites, routeurs,
// offres, accès, rapports et finances de l'organisation A. Les dates sont relatives à
// `FIXTURE_NOW` ; les tests figent l'horloge du navigateur sur cette même date.
import { http, HttpResponse } from "msw";
import { config } from "@/shared/config/environment";
import { fixtureEmail, orgA } from "./tenant-fixtures";

export const FIXTURE_NOW = "2026-09-15T10:00:00.000Z";
const now = Date.parse(FIXTURE_NOW);
const ago = (minutes: number) => new Date(now - minutes * 60_000).toISOString();
const day = (offset: number) =>
  new Date(now - offset * 86_400_000).toISOString().slice(0, 10);

export const fixtureSites = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    organizationId: orgA,
    name: "Café du Port",
    description: "Terrasse et salle principale",
    city: "Douala",
    district: "Bonanjo",
    addressDetails: "Rue de la Joie",
    timezone: "Africa/Douala",
    status: "ACTIVE",
    createdAt: ago(60 * 24 * 40),
    updatedAt: ago(60 * 24 * 3),
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    organizationId: orgA,
    name: "Résidence Bastos",
    description: null,
    city: "Yaoundé",
    district: "Bastos",
    addressDetails: null,
    timezone: "Africa/Douala",
    status: "SUSPENDED",
    createdAt: ago(60 * 24 * 20),
    updatedAt: ago(60 * 24),
  },
];
const [siteA, siteB] = fixtureSites;

const router = (
  index: number,
  siteId: string,
  name: string,
  overrides: Record<string, unknown> = {},
) => ({
  id: `20000000-0000-4000-8000-00000000000${index}`,
  organizationId: orgA,
  siteId,
  name,
  vendor: "MikroTik",
  model: "hAP ax2",
  lifecycleStatus: "ACTIVE",
  provisioningStatus: "REGISTERED",
  connectivityStatus: "ONLINE",
  provisioningOperationId: `op-${index}`,
  configurationArtifactId: `artifact-${index}`,
  failureCode: null,
  pendingAction: null,
  lastSeenAt: ago(3),
  createdAt: ago(60 * 24 * 30),
  updatedAt: ago(30),
  ...overrides,
});
export const fixtureRouters = [
  router(1, siteA.id, "Salle principale"),
  router(2, siteA.id, "Terrasse", {
    connectivityStatus: "OFFLINE",
    lastSeenAt: ago(60 * 5),
  }),
  router(3, siteB.id, "Hall d’entrée", {
    provisioningStatus: "PENDING_ENROLLMENT",
    connectivityStatus: "UNKNOWN",
    lastSeenAt: null,
  }),
];

/** Routeurs ajoutés pendant une démonstration ; ils suivent le parcours de mise en service. */
const createdRouters: ReturnType<typeof router>[] = [];
const findRouter = (id: unknown) =>
  [...fixtureRouters, ...createdRouters].find((r) => r.id === id);

const offer = (
  index: number,
  name: string,
  amount: number,
  validitySeconds: number,
  dataAllowanceBytes: number | null,
  status = "PUBLISHED",
) => ({
  offerId: `30000000-0000-4000-8000-00000000000${index}`,
  organizationId: orgA,
  siteId: siteA.id,
  name,
  description: "Connexion haut débit pour tout l’établissement.",
  price: { amount, currencyCode: "XAF" },
  accessPolicy: {
    validitySeconds,
    dataAllowanceBytes,
    downloadLimitBps: 10_000_000,
    uploadLimitBps: 2_000_000,
    maxConcurrentSessions: 1,
  },
  status,
  displayOrder: index,
  createdAt: ago(60 * 24 * 25),
  updatedAt: ago(60 * 24 * 2),
});
export const fixtureOffers = [
  offer(1, "Pass 1 heure", 200, 3600, 500_000_000),
  offer(2, "Pass journée", 500, 86_400, 2_000_000_000),
  offer(3, "Pass semaine", 2500, 604_800, null, "DRAFT"),
];

const grant = (
  index: number,
  status: string,
  activatedMinutesAgo: number | null,
  validitySeconds: number,
  sourceType = "PAID_ORDER",
) => {
  const activatedAt =
    activatedMinutesAgo === null ? null : ago(activatedMinutesAgo);
  return {
    accessGrantId: `40000000-0000-4000-8000-00000000000${index}`,
    organizationId: orgA,
    siteId: siteA.id,
    subjectType: "ANONYMOUS",
    subjectId: null,
    sourceType,
    sourceId: null,
    policy: {
      validitySeconds,
      dataAllowanceBytes: 2_000_000_000,
      downloadLimitBps: 10_000_000,
      uploadLimitBps: 2_000_000,
      maxConcurrentSessions: 1,
    },
    activationMode: "ON_FIRST_LOGIN",
    status,
    projectionStatus: status === "PENDING_PROVISIONING" ? "PENDING" : "APPLIED",
    issuedByIdentityId: null,
    issuedAt: ago((activatedMinutesAgo ?? 5) + 1),
    activatedAt,
    expiresAt:
      activatedAt === null
        ? null
        : new Date(
            Date.parse(activatedAt) + validitySeconds * 1000,
          ).toISOString(),
    suspendedAt: null,
    revokedAt: null,
    updatedAt: ago(2),
    username: `client-0${index}`,
  };
};
export const fixtureGrants = [
  grant(1, "ACTIVE", 20, 3600),
  grant(2, "ACTIVE", 60 * 20, 86_400),
  grant(3, "PENDING_PROVISIONING", null, 86_400, "MANUAL_GRANT"),
  grant(4, "EXPIRED", 60 * 30, 3600),
];

const salesSeries = Array.from({ length: 60 }, (_, index) => {
  const count = index % 7 === 0 ? 0 : 3 + ((index * 5) % 9);
  const gross = count * 400;
  return {
    periodStart: day(59 - index),
    count,
    grossAmount: gross,
    commissionAmount: gross * 0.1,
    netAmount: gross * 0.9,
    refundedAmount: 0,
  };
}).filter((point) => point.count > 0);

/** Sessions par jour entre deux dates incluses : valeur stable pour une date donnée. */
function sessionSeries(from: string, to: string) {
  const points: { periodStart: string; count: number }[] = [];
  const end = Date.parse(`${to}T00:00:00Z`);
  for (
    let time = Date.parse(`${from}T00:00:00Z`);
    time <= end && points.length < 400;
    time += 86_400_000
  ) {
    const index = Math.floor(time / 86_400_000);
    points.push({
      periodStart: new Date(time).toISOString().slice(0, 10),
      count: 18 + ((index * 7) % 23) + (index % 7 === 0 ? -12 : 0),
    });
  }
  return points;
}

function problem(status: number, type?: string) {
  return HttpResponse.json(
    {
      ...(type && { type: `https://api.ronetz.com/problems/${type}` }),
      title: "Request failed",
      status,
      code: "FIXTURE",
    },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}
/** Script factice : aucun secret réel, même en démonstration. */
export const fixtureScript = (routerId: string) =>
  `# Ronetz — script de démonstration\n/system identity set name="ronetz-${routerId}"\n`;
/** Artefact dont la fenêtre de 15 minutes est dépassée (410). */
export const expiredArtifactId = "artifact-2";
const page = <T>(content: T[], request: Request) => {
  const params = new URL(request.url).searchParams;
  const p = Number(params.get("page") ?? 0);
  const size = Number(params.get("size") ?? 20);
  return {
    content: content.slice(p * size, (p + 1) * size),
    page: p,
    size,
    totalElements: content.length,
    totalPages: Math.max(1, Math.ceil(content.length / size)),
  };
};

const api = config.apiBaseUrl + "/api";
const org = `${api}/organizations/:org`;
/** Seule l'organisation A d'un utilisateur connecté reçoit ces données. */
function authorized(request: Request, params: Record<string, unknown>) {
  return !!fixtureEmail(request) && (!params.org || params.org === orgA);
}

export const operationsHandlers = [
  http.get(`${org}/sites`, ({ request, params }) =>
    authorized(request, params)
      ? HttpResponse.json(fixtureSites)
      : problem(401),
  ),
  http.get(`${org}/sites/:site`, ({ request, params }) => {
    if (!authorized(request, params)) return problem(401);
    const site = fixtureSites.find((s) => s.id === params.site);
    return site ? HttpResponse.json(site) : problem(404);
  }),
  http.get(`${org}/routers`, ({ request, params }) =>
    authorized(request, params)
      ? HttpResponse.json(page([...fixtureRouters, ...createdRouters], request))
      : problem(401),
  ),
  http.get(`${api}/routers/:id`, ({ request, params }) => {
    if (!authorized(request, params)) return problem(401);
    const found = findRouter(params.id);
    return found ? HttpResponse.json(found) : problem(404);
  }),
  http.get(`${api}/routers/:id/provisioning`, ({ request, params }) => {
    if (!authorized(request, params)) return problem(401);
    const found = findRouter(params.id);
    return found ? HttpResponse.json(found) : problem(404);
  }),
  http.post(`${api}/routers`, async ({ request }) => {
    if (!authorized(request, {})) return problem(401);
    const body = (await request.json()) as Record<string, string>;
    const site = fixtureSites.find((s) => s.id === body.siteId);
    if (!site || body.organizationId !== orgA) return problem(404);
    if (site.status !== "ACTIVE") return problem(409);
    const created = router(createdRouters.length + 4, site.id, body.name, {
      id: crypto.randomUUID(),
      vendor: body.vendor,
      model: body.model,
      provisioningStatus: "NOT_REQUESTED",
      connectivityStatus: "UNKNOWN",
      provisioningOperationId: null,
      configurationArtifactId: null,
      lastSeenAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    createdRouters.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),
  http.post(`${api}/routers/:id/provisioning`, ({ request, params }) => {
    if (!authorized(request, params)) return problem(401);
    const found = createdRouters.find((r) => r.id === params.id);
    if (!found) return problem(404);
    // Démonstration : le script est prêt immédiatement.
    Object.assign(found, {
      provisioningStatus: "PENDING_ENROLLMENT",
      provisioningOperationId: `op-${found.id.slice(0, 8)}`,
      configurationArtifactId: `artifact-${found.id.slice(0, 8)}`,
      updatedAt: new Date().toISOString(),
    });
    return HttpResponse.json(found, { status: 202 });
  }),
  http.get(
    `${api}/routers/:id/configuration-artifacts/:artifact`,
    ({ request, params }) => {
      if (!authorized(request, params)) return problem(401);
      const found = findRouter(params.id);
      // Artefact courant uniquement ; toute autre référence est introuvable.
      if (!found || found.configurationArtifactId !== params.artifact)
        return problem(404);
      if (
        found.lifecycleStatus !== "ACTIVE" ||
        !["PENDING_ENROLLMENT", "REGISTERED"].includes(
          String(found.provisioningStatus),
        )
      )
        return problem(409);
      if (params.artifact === expiredArtifactId)
        return problem(410, "router-artifact-expired");
      return HttpResponse.text(fixtureScript(found.id), {
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
          "Content-Disposition": `attachment; filename="ronetz-${found.id}.rsc"`,
          "Cache-Control": "no-store",
        },
      });
    },
  ),
  http.get(`${org}/sites/:site/offers`, ({ request, params }) => {
    if (!authorized(request, params)) return problem(401);
    const content = fixtureOffers.filter((o) => o.siteId === params.site);
    return HttpResponse.json(page(content, request));
  }),
  http.get(`${api}/offers/:id`, ({ request, params }) => {
    if (!authorized(request, params)) return problem(401);
    const found = fixtureOffers.find((o) => o.offerId === params.id);
    return found ? HttpResponse.json(found) : problem(404);
  }),
  http.get(`${api}/public/sites/:site/offers`, ({ request, params }) =>
    HttpResponse.json(
      page(
        fixtureOffers.filter(
          (o) => o.siteId === params.site && o.status === "PUBLISHED",
        ),
        request,
      ),
    ),
  ),
  http.get(`${org}/access-grants`, ({ request, params }) =>
    authorized(request, params)
      ? HttpResponse.json(page(fixtureGrants, request))
      : problem(401),
  ),
  http.get(`${org}/sites/:site/access-grants`, ({ request, params }) =>
    authorized(request, params)
      ? HttpResponse.json(
          page(
            fixtureGrants.filter((g) => g.siteId === params.site),
            request,
          ),
        )
      : problem(401),
  ),
  http.get(`${api}/access-grants/:id`, ({ request, params }) => {
    if (!authorized(request, params)) return problem(401);
    const found = fixtureGrants.find((g) => g.accessGrantId === params.id);
    return found ? HttpResponse.json(found) : problem(404);
  }),
  http.get(`${org}/reports/overview`, ({ request, params }) =>
    authorized(request, params)
      ? HttpResponse.json({
          organizationId: orgA,
          organizationName: "Organisation A",
          currency: "XAF",
          totalSites: 2,
          activeSites: 1,
          totalRouters: 3,
          onlineRouters: 1,
          totalOffers: 3,
          activeOffers: 2,
          totalPurchases: 312,
          successfulPayments: 298,
          failedPayments: 14,
          provisionedAccesses: 298,
          activeAccesses: 2,
          grossRevenue: 124_800,
          netRevenue: 112_320,
          availableBalance: 48_500,
          dataLastUpdatedAt: ago(15),
        })
      : problem(401),
  ),
  http.get(`${org}/reports/sales`, ({ request, params }) => {
    if (!authorized(request, params)) return problem(401);
    const sum = (
      key: "count" | "grossAmount" | "netAmount" | "commissionAmount",
    ) => salesSeries.reduce((total, point) => total + point[key], 0);
    return HttpResponse.json({
      organizationId: orgA,
      currency: "XAF",
      salesCount: sum("count"),
      confirmedPayments: sum("count"),
      failedPayments: 4,
      grossRevenue: sum("grossAmount"),
      commissionAmount: sum("commissionAmount"),
      netRevenue: sum("netAmount"),
      series: salesSeries,
      generatedAt: FIXTURE_NOW,
    });
  }),
  http.get(`${org}/reports/access`, ({ request, params }) => {
    if (!authorized(request, params)) return problem(401);
    // La période renvoyée reprend celle demandée, comme le backend ; les totaux suivent
    // une série quotidienne déterministe, pour que deux périodes se comparent.
    const query = new URL(request.url).searchParams;
    const from = query.get("from") ?? day(29);
    const to = query.get("to") ?? day(0);
    const series = sessionSeries(from, to);
    const sessions = series.reduce((total, point) => total + point.count, 0);
    return HttpResponse.json({
      organizationId: orgA,
      period: {
        from,
        to,
        timeZone: query.get("timeZone") ?? "Africa/Douala",
        granularity: "DAY",
      },
      created: Math.round(sessions / 8.5),
      provisioned: Math.round(sessions / 8.7),
      active: 2,
      expired: Math.round(sessions / 9.3),
      suspended: 0,
      revoked: 1,
      authenticationSuccesses: Math.round(sessions * 0.92),
      authenticationFailures: Math.round(sessions * 0.012),
      sessions,
      inputBytes: sessions * 12_200_000,
      outputBytes: sessions * 66_600_000,
      series,
      generatedAt: FIXTURE_NOW,
    });
  }),
  http.get(`${org}/reports/routers`, ({ request, params }) =>
    authorized(request, params)
      ? HttpResponse.json(
          fixtureRouters.map((r, index) => ({
            organizationId: orgA,
            siteId: r.siteId,
            routerId: r.id,
            routerName: r.name,
            status: r.connectivityStatus,
            lastSeenAt: r.lastSeenAt,
            accessCount: 40 - index * 10,
            authenticationSuccessCount: 500 - index * 120,
            authenticationFailureCount: 4 + index,
            totalSessionCount: 600 - index * 150,
            totalInputBytes: (8 - index * 2) * 1_000_000_000,
            totalOutputBytes: (40 - index * 12) * 1_000_000_000,
            lastUpdatedAt: ago(15),
          })),
        )
      : problem(401),
  ),
  http.get(`${org}/reports/sites`, ({ request, params }) =>
    authorized(request, params)
      ? HttpResponse.json(
          fixtureSites.map((site, index) => {
            const routers = fixtureRouters.filter((r) => r.siteId === site.id);
            return {
              organizationId: orgA,
              siteId: site.id,
              siteName: site.name,
              routerCount: routers.length,
              onlineRouterCount: routers.filter(
                (r) => r.connectivityStatus === "ONLINE",
              ).length,
              activeOfferCount: 3 - index * 2,
              purchaseCount: 180 - index * 120,
              successfulPaymentCount: 172 - index * 116,
              accessCount: 160 - index * 110,
              lastUpdatedAt: ago(15),
            };
          }),
        )
      : problem(401),
  ),
  http.get(`${org}/accounting/balance`, ({ request, params }) =>
    authorized(request, params)
      ? HttpResponse.json({
          organizationId: orgA,
          availableAmount: 48_500,
          reservedAmount: 15_000,
          paidOutAmount: 46_000,
          currency: "XAF",
        })
      : problem(401),
  ),
  http.get(`${org}/accounting/ledger`, ({ request, params }) =>
    authorized(request, params)
      ? HttpResponse.json(
          page(
            [0, 1, 2].map((index) => ({
              id: `50000000-0000-4000-8000-00000000000${index}`,
              reference: `SALE:60000000-0000-4000-8000-00000000000${index}`,
              type: "SALE",
              grossAmount: 500,
              commissionAmount: 50,
              netAmount: 450,
              currency: "XAF",
              externalReference: null,
              createdAt: ago(30 + index * 90),
            })),
            request,
          ),
        )
      : problem(401),
  ),
  http.get(`${org}/withdrawals`, ({ request, params }) =>
    authorized(request, params)
      ? HttpResponse.json(
          page(
            [
              {
                id: "70000000-0000-4000-8000-000000000001",
                organizationId: orgA,
                amount: 15_000,
                currency: "XAF",
                network: "MTN",
                country: "CM",
                maskedMsisdn: "6•••••42",
                recipientName: "Ada Nkemdirim",
                status: "PROCESSING",
                requestedAt: ago(60 * 26),
                decidedAt: ago(60 * 20),
                decisionReason: null,
                completedAt: null,
                failureReason: null,
              },
            ],
            request,
          ),
        )
      : problem(401),
  ),
];
