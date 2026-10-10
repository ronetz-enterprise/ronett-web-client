import { useParams } from "react-router";
import { PurchaseTracking } from "@/features/purchase";
export function meta() {
  return [
    { title: "Votre achat · Ronetz" },
    { name: "robots", content: "noindex, nofollow" },
    { name: "referrer", content: "no-referrer" },
  ];
}
export default function Page() {
  const { siteId = "", purchaseId = "" } = useParams();
  return (
    <PurchaseTracking
      key={purchaseId}
      siteId={siteId}
      purchaseId={purchaseId}
    />
  );
}
