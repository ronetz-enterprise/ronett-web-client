import { Amount } from "@/shared/components/amount";

export function AmountExample() {
  return (
    <span className="flex gap-3">
      <Amount value={4800} currency="XAF" signed />
      <Amount value={-1000} currency="XAF" signed />
    </span>
  );
}
