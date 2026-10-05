import { Link } from "react-router";
import {
  accessDisplayState,
  accessRoutes,
  useAccessGrantList,
} from "@/features/access";
import type { Membership } from "@/features/memberships";
import { useOffers } from "@/features/offer";
import { routerRoutes, useRouterSummary } from "@/features/router";
import { siteRoutes, type Site } from "@/features/site";
import { formatNumber } from "@/shared/utils/format";

const SCAN = 100;

/** Offres d'un site, sur la plus grande page autorisée par le backend. */
function useOfferCounts(active: Membership, siteId: string) {
  const query = useOffers(active, siteId, 0, SCAN);
  const content = query.data?.content ?? [];
  return {
    isSuccess: query.isSuccess,
    published: content.filter((offer) => offer.status === "PUBLISHED").length,
    total: Number(query.data?.totalElements ?? 0),
  };
}

/** Accès du site qui permettent de se connecter en ce moment, sur la plus grande page lue. */
function useActiveAccessCount(active: Membership, siteId: string) {
  const query = useAccessGrantList(active, 0, SCAN, siteId);
  const content = query.data?.content ?? [];
  return {
    isSuccess: query.isSuccess,
    usable: content.filter((grant) => accessDisplayState(grant).usable).length,
    partial: (query.data?.totalElements ?? 0) > SCAN,
  };
}

function Metric({
  label,
  value,
  context,
  links,
}: {
  label: string;
  value: string;
  context: string;
  links: { to: string; label: string }[];
}) {
  return (
    <div className="min-w-0 space-y-2 py-4 sm:px-5 sm:first:pl-0">
      <div className="space-y-0.5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{context}</p>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="text-sm font-medium text-primary hover:underline hover:underline-offset-4"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Bande « En bref » de la vue d'ensemble : routeurs, offres et accès du site. Chaque chiffre
 * mène à la liste correspondante, déjà filtrée sur le site (pas d'onglet en double).
 */
export function SiteMetrics({
  active,
  site,
}: {
  active: Membership;
  site: Site;
}) {
  const routers = useRouterSummary(active);
  const offers = useOfferCounts(active, site.id);
  const access = useActiveAccessCount(active, site.id);
  const { online, total } = routers.forSite(site.id);
  const org = active.organizationId;
  const filtered = (path: string) =>
    `${path}?site=${encodeURIComponent(site.id)}`;
  const loading = "Chargement…";
  return (
    <div className="grid divide-y border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <Metric
        label="Routeurs en ligne"
        value={
          routers.isSuccess
            ? `${formatNumber(online)} / ${formatNumber(total)}`
            : "—"
        }
        context={
          routers.isSuccess
            ? routers.partial
              ? "parmi les 100 premiers routeurs"
              : "routeurs de ce site"
            : loading
        }
        links={[
          { to: filtered(routerRoutes.list(org)), label: "Voir les routeurs" },
          ...(site.status === "ACTIVE"
            ? [{ to: routerRoutes.create(org, site.id), label: "Ajouter" }]
            : []),
        ]}
      />
      <Metric
        label="Offres publiées"
        value={
          offers.isSuccess
            ? `${formatNumber(offers.published)} / ${formatNumber(offers.total)}`
            : "—"
        }
        context={offers.isSuccess ? "visibles sur le portail" : loading}
        links={[
          { to: siteRoutes.offers(org, site.id), label: "Voir les offres" },
        ]}
      />
      <Metric
        label="Accès actifs"
        value={access.isSuccess ? formatNumber(access.usable) : "—"}
        context={
          access.isSuccess
            ? access.partial
              ? "parmi les 100 derniers accès"
              : "clients pouvant se connecter"
            : loading
        }
        links={[
          { to: filtered(accessRoutes.list(org)), label: "Voir les accès" },
        ]}
      />
    </div>
  );
}

/** Cellule « Routeurs » de la liste : routeurs en ligne sur le total. */
export function SiteRoutersCell({
  site,
  routers,
}: {
  site: Site;
  routers: ReturnType<typeof useRouterSummary>;
}) {
  if (!routers.isSuccess)
    return <span className="text-muted-foreground">—</span>;
  const { online, total } = routers.forSite(site.id);
  if (!total) return <span className="text-muted-foreground">Aucun</span>;
  const tone =
    online === total
      ? "bg-success-foreground"
      : online
        ? "bg-warning-foreground"
        : "bg-muted-foreground/60";
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap tabular-nums">
      <span aria-hidden="true" className={`size-1.5 rounded-full ${tone}`} />
      <span>
        <span className="font-medium">{formatNumber(online)}</span> /{" "}
        {formatNumber(total)} en ligne
      </span>
    </span>
  );
}
