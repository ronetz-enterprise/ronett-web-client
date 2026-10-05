import { useLocation, useNavigate } from "react-router";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

export type DetailTab = {
  label: string;
  to: string;
  /** Onglet masqué (et non désactivé) si l'utilisateur ne peut pas l'ouvrir. */
  hidden?: boolean;
  badge?: React.ReactNode;
};

/**
 * Onglets d'un objet pilotés par l'URL : l'onglet actif est celui dont le chemin est le plus
 * long préfixe de l'URL courante ; cliquer navigue. Retour, partage et rechargement fonctionnent.
 * À passer au `tabs` du `PageHeader`.
 */
export function DetailTabs({
  tabs,
  label,
}: {
  tabs: DetailTab[];
  label: string;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const visible = tabs.filter((tab) => !tab.hidden);
  if (visible.length < 2) return null;
  const path = (to: string) => to.split("?")[0];
  const current =
    visible
      .filter(
        (tab) =>
          pathname === path(tab.to) || pathname.startsWith(path(tab.to) + "/"),
      )
      .sort((a, b) => path(b.to).length - path(a.to).length)[0] ?? visible[0];
  return (
    <Tabs value={current.to} onValueChange={(value) => navigate(String(value))}>
      <TabsList variant="line" aria-label={label}>
        {visible.map((tab) => (
          <TabsTrigger key={tab.to} value={tab.to}>
            {tab.label}
            {tab.badge}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
