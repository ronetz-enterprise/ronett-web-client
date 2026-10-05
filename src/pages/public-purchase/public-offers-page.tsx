import { useParams } from "react-router";
import { PublicOffers } from "@/features/purchase";
export function meta() {
  return [
    { title: "Offres Internet · Ronetz" },
    { name: "robots", content: "noindex, nofollow" },
    { name: "referrer", content: "no-referrer" },
  ];
}
export default function Page() {
  const { siteId = "" } = useParams();
  return <PublicOffers key={siteId} siteId={siteId} />;
}
