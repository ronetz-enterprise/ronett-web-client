import { createContext } from "react";
import type { CreateValues } from "../model/offer";

/**
 * Modification en place d'une offre : chaque champ se valide (✓) ou s'annule (✗)
 * indépendamment des autres. Absent en création, où le formulaire s'envoie d'un bloc.
 */
export const InlineEditContext = createContext<{
  commit: (fields: (keyof CreateValues)[]) => Promise<void>;
  cancel: (fields: (keyof CreateValues)[]) => void;
  pending: boolean;
} | null>(null);
