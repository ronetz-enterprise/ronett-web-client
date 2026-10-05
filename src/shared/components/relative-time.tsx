import { useEffect, useState } from "react";
import { formatDateTime, formatRelative } from "@/shared/utils/format";

/** « il y a 3 min », mis à jour chaque minute ; la date exacte au survol et pour l'accessibilité. */
export function RelativeTime({
  value,
  className,
}: {
  value: string | null | undefined;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  if (!value) return <span className={className}>—</span>;
  return (
    <time dateTime={value} title={formatDateTime(value)} className={className}>
      {formatRelative(value, now)}
    </time>
  );
}
