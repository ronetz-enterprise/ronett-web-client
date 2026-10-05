import { FieldHeader } from "@/shared/components/field-header";
import { useId, useState, type ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { UnlimitedSwitch } from "@/shared/components/unlimited-switch";
import { UnitInput } from "@/shared/components/unit-input";
import type { CreateValues } from "../model/offer";

type Unit = { label: string; factor: bigint };
export const durationUnits: Unit[] = [
  { label: "minutes", factor: 60n },
  { label: "heures", factor: 3600n },
  { label: "jours", factor: 86400n },
];
export const dataUnits: Unit[] = [
  { label: "Mo", factor: 1000000n },
  { label: "Go", factor: 1000000000n },
];
export const rateUnits: Unit[] = [
  { label: "kbit/s", factor: 1000n },
  { label: "Mbit/s", factor: 1000000n },
];

/** Valeur serveur (unité de base) → saisie : la plus grande unité qui tombe juste. */
function split(value: string, units: Unit[], fallback: number, base: Unit) {
  if (!/^[1-9]\d*$/.test(value)) return { amount: "", unit: units[fallback] };
  const number = BigInt(value);
  const unit = [...units].reverse().find((u) => number % u.factor === 0n);
  return unit
    ? { amount: String(number / unit.factor), unit }
    : { amount: value, unit: base };
}

/**
 * Champ « nombre + unité » d'une offre : la saisie et le choix de l'unité sont deux contrôles
 * distincts ; la valeur envoyée reste en unité de base (secondes, octets, bit/s). Avec
 * `unlimitable`, un interrupteur « Illimité » remplace la convention « champ vide ».
 */
export function OfferUnitField({
  name,
  label,
  units,
  baseLabel,
  defaultUnit = 0,
  max,
  maxMessage,
  description,
  unlimitable = false,
  startUnlimited = false,
  after,
}: {
  /** Contrôles placés après la saisie (ou après « Illimité » quand la saisie est masquée). */
  after?: ReactNode;
  /** Offre existante sans limite : l'interrupteur démarre activé. Jamais à la création. */
  startUnlimited?: boolean;
  name: keyof CreateValues;
  label: string;
  units: Unit[];
  /** Unité de base, proposée seulement si une valeur existante ne tombe sur aucune unité. */
  baseLabel: string;
  defaultUnit?: number;
  max: bigint;
  maxMessage: string;
  description?: string;
  unlimitable?: boolean;
}) {
  const id = useId();
  const { register, setValue, getValues, getFieldState, formState } =
    useFormContext<CreateValues>();
  const base: Unit = { label: baseLabel, factor: 1n };
  const [initial] = useState(() =>
    split(getValues(name), units, defaultUnit, base),
  );
  const [amount, setAmount] = useState(initial.amount);
  const [unit, setUnit] = useState(initial.unit);
  const [unlimited, setUnlimited] = useState(
    unlimitable && startUnlimited && getValues(name) === "",
  );
  const options = units.includes(unit) ? units : [base, ...units];

  function commit(nextAmount: string, nextUnit: Unit, nextUnlimited: boolean) {
    let value: string;
    if (nextUnlimited) value = "";
    else if (/^[1-9]\d{0,18}$/.test(nextAmount))
      value = String(BigInt(nextAmount) * nextUnit.factor);
    // Vide sans « Illimité » : valeur invalide exprès, pour que le schéma refuse l'envoi.
    else value = nextAmount === "" && unlimitable ? "-" : nextAmount;
    setValue(name, value, {
      shouldDirty: true,
      shouldValidate: formState.isSubmitted,
    });
  }

  // Message dans les unités saisies, plutôt que celui du schéma en unité de base.
  const local = unlimited
    ? undefined
    : amount === ""
      ? "Indiquez une valeur."
      : !/^[1-9]\d{0,18}$/.test(amount)
        ? "Saisissez un nombre entier positif."
        : BigInt(amount) * unit.factor > max
          ? maxMessage
          : undefined;
  const schemaError = getFieldState(name, formState).error;
  const error = schemaError ? (local ?? schemaError.message) : undefined;

  return (
    <div className="space-y-2">
      <FieldHeader
        htmlFor={id}
        label={label}
        description={unlimited ? undefined : description}
        descriptionId={`${id}-help`}
        aside={
          unlimitable && (
            <div className="flex items-center gap-3">
              <UnlimitedSwitch
                label={label}
                checked={unlimited}
                onChange={(checked) => {
                  setUnlimited(checked);
                  commit(amount, unit, checked);
                }}
              />
              {unlimited && after}
            </div>
          )
        }
      />
      {!unlimited && (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <UnitInput
              id={id}
              name={name}
              inputMode="numeric"
              value={amount}
              aria-invalid={!!error}
              aria-describedby={`${id}-help ${id}-error`}
              onChange={(event) => {
                setAmount(event.target.value);
                commit(event.target.value, unit, false);
              }}
              unit={unit.label}
              units={options.map((u) => ({ value: u.label, label: u.label }))}
              unitLabel={`Unité : ${label}`}
              onUnitChange={(value) => {
                const next = options.find((u) => u.label === value) ?? unit;
                setUnit(next);
                commit(amount, next, false);
              }}
            />
          </div>
          {after}
        </div>
      )}
      {/* Enregistre le champ auprès du formulaire (réinitialisation, valeurs par défaut). */}
      <input type="hidden" {...register(name)} />
      <p
        id={`${id}-error`}
        aria-live="polite"
        className="text-sm text-destructive empty:hidden"
      >
        {error}
      </p>
    </div>
  );
}
