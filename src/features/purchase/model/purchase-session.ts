import { z } from "zod";

/**
 * Ce que l'appareil de l'acheteur garde pendant l'achat, dans `sessionStorage` (effacé à la
 * fermeture de l'onglet) : le jeton d'achat est la seule preuve qui permet de suivre l'achat et
 * de récupérer les identifiants. Il n'est jamais placé dans l'URL.
 *
 * Le jeton permet de payer pendant 20 minutes et de suivre l'achat pendant 24 heures. Le mot de
 * passe, lui, n'est jamais stocké : il est redemandé au serveur tant que la remise est possible.
 */
const sessionSchema = z.object({
  purchaseId: z.uuid(),
  siteId: z.uuid(),
  offerId: z.uuid(),
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  payableUntil: z.iso.datetime({ offset: true }),
  network: z.string(),
  phone: z.string(),
  paymentId: z.uuid().nullable(),
  createdAt: z.iso.datetime({ offset: true }),
});
export type PurchaseSession = z.infer<typeof sessionSchema>;

const key = (purchaseId: string) => `ronetz.purchase.${purchaseId}`;

export function readPurchaseSession(
  purchaseId: string,
): PurchaseSession | null {
  try {
    const raw = window.sessionStorage.getItem(key(purchaseId));
    if (!raw) return null;
    const parsed = sessionSchema.safeParse(JSON.parse(raw));
    return parsed.success && parsed.data.purchaseId === purchaseId
      ? parsed.data
      : null;
  } catch {
    return null;
  }
}

export function savePurchaseSession(session: PurchaseSession) {
  try {
    window.sessionStorage.setItem(
      key(session.purchaseId),
      JSON.stringify(session),
    );
    return true;
  } catch {
    // Navigation privée stricte : le suivi restera possible tant que la page n'est pas rechargée.
    return false;
  }
}

export function updatePurchaseSession(
  purchaseId: string,
  patch: Partial<Pick<PurchaseSession, "paymentId" | "network" | "phone">>,
) {
  const current = readPurchaseSession(purchaseId);
  if (current) savePurchaseSession({ ...current, ...patch });
}

/**
 * Page de connexion du hotspot d'où vient le client (`?login=` posé par le portail du routeur).
 * Seule une adresse de réseau local est retenue : le lien ne sert qu'à y revenir, jamais à
 * envoyer des identifiants.
 */
const portalKey = (siteId: string) => `ronetz.portal.${siteId}`;

export function safeHotspotLogin(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname;
    const privateIp =
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      !privateIp ||
      url.username ||
      url.password
    )
      return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function rememberHotspotLogin(siteId: string, value: string | null) {
  const safe = safeHotspotLogin(value);
  if (!safe) return;
  try {
    window.sessionStorage.setItem(portalKey(siteId), safe);
  } catch {
    // Sans stockage, le client reviendra au portail par ses propres moyens.
  }
}

export function hotspotLogin(siteId: string) {
  try {
    return safeHotspotLogin(window.sessionStorage.getItem(portalKey(siteId)));
  } catch {
    return null;
  }
}
