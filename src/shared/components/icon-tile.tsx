import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/shared/utils/cn";
import { objectIcons, type ObjectType } from "./object-icons";

const sizes = {
  sm: "size-6 rounded-md [&_svg]:size-3.5",
  md: "size-8 rounded-lg [&_svg]:size-4",
  lg: "size-11 rounded-xl [&_svg]:size-5",
} as const;

/** Icône d'objet dans un carré gris neutre : le repère visuel de chaque type. */
export function IconTile({
  type,
  icon,
  size = "md",
  className,
}: {
  type?: ObjectType;
  icon?: (typeof objectIcons)[ObjectType];
  size?: keyof typeof sizes;
  className?: string;
}) {
  const glyph = icon ?? (type ? objectIcons[type] : undefined);
  if (!glyph) return null;
  return (
    <span
      aria-hidden="true"
      data-slot="icon-tile"
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-muted text-foreground/75 ring-1 ring-border/60",
        sizes[size],
        className,
      )}
    >
      <HugeiconsIcon icon={glyph} strokeWidth={1.75} />
    </span>
  );
}
