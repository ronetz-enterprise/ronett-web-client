import { createContext, useContext } from "react";

/**
 * Gabarit unique des modales de formulaire (création, retrait, remboursement, motifs…) :
 * en-tête fixe, corps qui défile sur une seule colonne, actions collées en bas. Le contexte
 * permet aux formulaires et sections partagés d'adopter ce rendu et de fermer la modale.
 */
export const FormDialogContext = createContext<{ close: () => void } | null>(
  null,
);

export const useFormDialog = () => useContext(FormDialogContext);

/** Section de formulaire à plat dans une modale : titre discret, sections séparées par un filet. */
export const dialogSectionClass =
  "space-y-4 border-t pt-6 first:border-t-0 first:pt-0";
export const dialogSectionTitleClass = "text-sm font-semibold";

/** Barre d'actions collée au bas du corps de la modale (compense son padding de 1,5 rem). */
export const dialogFooterClass =
  "sticky -bottom-6 z-10 -mx-6 -mb-6 flex flex-wrap items-center justify-end gap-2 bg-popover px-6 pt-4 pb-6 [&_button]:min-h-10";
