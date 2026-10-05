import { useContext } from "react";
import { useFormContext } from "react-hook-form";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/shared/ui/button";
import type { CreateValues } from "../model/offer";
import { InlineEditContext } from "./offer-inline-edit-context";

/**
 * Boutons ✓ / ✗ affichés juste après un champ modifié : enregistrer cette valeur seule, ou
 * revenir à la valeur enregistrée. Rien n'apparaît tant que le champ est inchangé.
 */
export function FieldConfirm({
  fields,
  label,
}: {
  fields: (keyof CreateValues)[];
  label: string;
}) {
  const inline = useContext(InlineEditContext);
  const { getFieldState, formState } = useFormContext<CreateValues>();
  if (!inline) return null;
  if (!fields.some((name) => getFieldState(name, formState).isDirty))
    return null;
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        size="icon"
        aria-label={`Enregistrer : ${label}`}
        disabled={inline.pending}
        onClick={() => void inline.commit(fields)}
      >
        <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="outline"
        aria-label={`Annuler : ${label}`}
        disabled={inline.pending}
        onClick={() => inline.cancel(fields)}
      >
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
      </Button>
    </div>
  );
}
