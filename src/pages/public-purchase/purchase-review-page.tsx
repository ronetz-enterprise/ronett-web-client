import { useParams } from "react-router";
import { PurchaseReview } from "@/features/purchase";
export function meta() {
  return [
    { title: "Votre offre · Ronetz" },
    { name: "robots", content: "noindex, nofollow" },
    { name: "referrer", content: "no-referrer" },
  ];
}
export default function Page() {
  const { siteId = "", offerId = "" } = useParams();
  return (
    <PurchaseReview
      key={`${siteId}/${offerId}`}
      siteId={siteId}
      offerId={offerId}
    />
  );
}
