import {
  Building03Icon,
  ChartLineData01Icon,
  Invoice01Icon,
  Key01Icon,
  MapsIcon,
  MoneyReceive01Icon,
  MoneySend01Icon,
  RouterIcon,
  Ticket01Icon,
  UserGroupIcon,
  UserIcon,
  Wallet01Icon,
  Wifi01Icon,
} from "@hugeicons/core-free-icons";

/**
 * Une icône constante par type d'objet métier, partout dans l'application
 * (en-têtes, cartes, états vides, recherche). Ne pas choisir d'icône au cas par cas.
 */
export const objectIcons = {
  organization: Building03Icon,
  site: MapsIcon,
  router: RouterIcon,
  offer: Ticket01Icon,
  access: Wifi01Icon,
  credential: Key01Icon,
  usage: ChartLineData01Icon,
  finance: Wallet01Icon,
  withdrawal: MoneySend01Icon,
  sale: MoneyReceive01Icon,
  refund: Invoice01Icon,
  member: UserIcon,
  members: UserGroupIcon,
} as const;

export type ObjectType = keyof typeof objectIcons;
