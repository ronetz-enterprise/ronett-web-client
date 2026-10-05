import { useId } from "react";
import { Switch } from "@/shared/ui/switch";

/** Interrupteur « Illimité » placé à droite du libellé d'un champ qui accepte l'absence de limite. */
export function UnlimitedSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Nom du champ, pour l'annonce aux lecteurs d'écran. */
  label: string;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        aria-label={`${label} illimité`}
      />
      <label
        htmlFor={id}
        className="cursor-pointer text-sm text-muted-foreground"
      >
        Illimité
      </label>
    </div>
  );
}
