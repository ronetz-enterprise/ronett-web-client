import { Link } from "react-router";
import { IconTile } from "@/shared/components/icon-tile";
import type { ObjectType } from "@/shared/components/object-icons";
import { Button } from "@/shared/ui/button";

const features: { icon: ObjectType; title: string; text: string }[] = [
  {
    icon: "site",
    title: "Vos sites et routeurs",
    text: "Déclarez vos lieux, installez vos équipements et suivez leur connexion.",
  },
  {
    icon: "offer",
    title: "Des offres à votre prix",
    text: "Durée, volume et débit : vos clients achètent depuis le portail du site.",
  },
  {
    icon: "finance",
    title: "Vos revenus en mobile money",
    text: "Suivez vos ventes et retirez votre solde vers MTN ou Orange Money.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10 py-4 sm:py-8">
      <section className="space-y-5 rounded-2xl bg-primary/5 p-6 sm:p-10">
        <h1
          tabIndex={-1}
          className="max-w-xl font-heading text-3xl font-semibold tracking-tight outline-none sm:text-4xl"
        >
          Vendez votre WiFi, simplement.
        </h1>
        <p className="max-w-prose text-muted-foreground">
          Ronetz est votre espace de gestion WiFi : sites, routeurs, offres et
          encaissements au même endroit.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button nativeButton={false} render={<Link to="/auth/register" />}>
            Créer un compte
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link to="/auth/login" />}
          >
            Se connecter
          </Button>
        </div>
      </section>
      <ul className="grid gap-6 sm:grid-cols-3">
        {features.map((feature) => (
          <li key={feature.title} className="space-y-2">
            <IconTile type={feature.icon} />
            <h2 className="font-heading text-sm font-semibold">
              {feature.title}
            </h2>
            <p className="text-sm text-muted-foreground">{feature.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
