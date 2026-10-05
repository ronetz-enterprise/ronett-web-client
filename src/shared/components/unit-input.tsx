import type { ComponentProps } from "react";
import { ButtonGroup, ButtonGroupText } from "@/shared/ui/button-group";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/shared/ui/select";

/**
 * Saisie avec unité (modèle shadcn « ButtonGroup + Select ») : l'unité, à gauche, est collée à
 * la zone de saisie. Avec `units`, elle se choisit dans une liste ; sinon elle est fixe
 * (devise, Mbit/s).
 */
export function UnitInput({
  unit,
  units,
  onUnitChange,
  unitLabel = "Unité",
  ...input
}: ComponentProps<typeof Input> & {
  unit: string;
  units?: readonly { value: string; label: string }[];
  onUnitChange?: (value: string) => void;
  /** Nom accessible du sélecteur d'unité. */
  unitLabel?: string;
}) {
  return (
    <ButtonGroup className="w-full">
      {units ? (
        <Select
          items={units}
          value={unit}
          onValueChange={(value) => value && onUnitChange?.(value as string)}
        >
          <SelectTrigger aria-label={unitLabel} className="w-24 shrink-0">
            {units.find((item) => item.value === unit)?.label ?? unit}
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start">
            <SelectGroup>
              {units.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ) : (
        <ButtonGroupText className="w-24 shrink-0 text-sm font-normal text-muted-foreground">
          {unit}
        </ButtonGroupText>
      )}
      <Input {...input} className="min-w-0 flex-1" />
    </ButtonGroup>
  );
}
