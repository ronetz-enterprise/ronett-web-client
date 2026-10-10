import { useId } from "react";
import { useForm } from "react-hook-form";
import { HugeiconsIcon } from "@hugeicons/react";
import { SmartPhone01Icon, SquareLock02Icon } from "@hugeicons/core-free-icons";
import { zodResolver } from "@/shared/components/form-utils";
import { useOnline } from "@/shared/hooks/use-online";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/shared/ui/input-group";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { cn } from "@/shared/utils/cn";
import {
  COUNTRY_CODE,
  formatLocalNumber,
  guessNetwork,
  mobileMoneyOperators,
  paymentFormSchema,
  type PaymentFormValues,
} from "../model/mobile-money";

/**
 * Formulaire de paiement mobile money : opérateur, numéro (indicatif +237 fixé), e-mail facultatif
 * pour le reçu. Utilisé à l'achat et pour réessayer un paiement (sans le champ e-mail).
 *
 * Le bouton reste en bas de l'écran sur téléphone, comme sur la liste des offres.
 */
export function PaymentForm({
  submitLabel,
  pending,
  error,
  defaultValues,
  withEmail = true,
  onSubmit,
}: {
  submitLabel: string;
  pending: boolean;
  error?: string | null;
  defaultValues?: Partial<PaymentFormValues>;
  withEmail?: boolean;
  onSubmit: (values: PaymentFormValues) => void;
}) {
  const id = useId();
  const online = useOnline();
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      network: undefined,
      phone: "",
      email: "",
      ...defaultValues,
    },
  });
  const { errors } = form.formState;
  const network = form.watch("network");
  const phone = form.register("phone");
  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={form.handleSubmit((values) => {
        if (!pending) onSubmit(values);
      })}
    >
      <fieldset className="space-y-2" aria-describedby={`${id}-network-error`}>
        <legend className="mb-2 text-sm font-medium">Opérateur</legend>
        <div className="grid grid-cols-2 gap-3">
          {mobileMoneyOperators.map((operator) => {
            const checked = network === operator.network;
            return (
              <label
                key={operator.network}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border bg-card px-3 py-3 text-sm transition-colors has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50",
                  checked
                    ? "border-primary ring-2 ring-primary"
                    : "hover:bg-muted/50",
                )}
              >
                <input
                  type="radio"
                  value={operator.network}
                  {...form.register("network")}
                  className="size-4 shrink-0 accent-primary"
                />
                <span className="font-medium leading-tight">
                  {operator.name}
                </span>
              </label>
            );
          })}
        </div>
        <p
          id={`${id}-network-error`}
          aria-live="polite"
          className="text-sm text-destructive empty:hidden"
        >
          {errors.network?.message}
        </p>
      </fieldset>

      <div className="space-y-2">
        <label htmlFor={`${id}-phone`} className="text-sm font-medium">
          Numéro Mobile Money
        </label>
        <InputGroup className="h-11">
          <InputGroupAddon>
            <HugeiconsIcon
              icon={SmartPhone01Icon}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <InputGroupText>+{COUNTRY_CODE}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id={`${id}-phone`}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="6 77 11 22 33"
            aria-invalid={!!errors.phone}
            aria-describedby={`${id}-phone-help ${id}-phone-error`}
            className="font-mono text-base tracking-wide"
            {...phone}
            onChange={(event) => {
              const formatted = formatLocalNumber(event.target.value);
              event.target.value = formatted;
              void phone.onChange(event);
              // Présélection seulement si le client n'a pas encore choisi.
              const guess = guessNetwork(formatted);
              if (guess && !form.getValues("network"))
                form.setValue("network", guess, {
                  shouldValidate: form.formState.isSubmitted,
                });
            }}
          />
        </InputGroup>
        <p id={`${id}-phone-help`} className="text-sm text-muted-foreground">
          La demande de paiement sera envoyée sur ce numéro.
        </p>
        <p
          id={`${id}-phone-error`}
          aria-live="polite"
          className="text-sm text-destructive empty:hidden"
        >
          {errors.phone?.message}
        </p>
      </div>

      {withEmail && (
        <div className="space-y-2">
          <label htmlFor={`${id}-email`} className="text-sm font-medium">
            E-mail pour le reçu{" "}
            <span className="font-normal text-muted-foreground">
              (facultatif)
            </span>
          </label>
          <Input
            id={`${id}-email`}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            aria-invalid={!!errors.email}
            aria-describedby={`${id}-email-error`}
            className="h-11"
            {...form.register("email")}
          />
          <p
            id={`${id}-email-error`}
            aria-live="polite"
            className="text-sm text-destructive empty:hidden"
          >
            {errors.email?.message}
          </p>
        </div>
      )}

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!online && (
        <Alert variant="warning">
          <AlertDescription>
            Vous semblez hors ligne. Reconnectez-vous au WiFi pour payer.
          </AlertDescription>
        </Alert>
      )}

      <div className="fixed inset-x-0 bottom-0 z-10 space-y-2 border-t bg-background/95 p-4 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0">
        <Button
          type="submit"
          className="min-h-11 w-full"
          disabled={pending || !online}
        >
          {pending ? "Envoi de la demande…" : submitLabel}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <HugeiconsIcon
            icon={SquareLock02Icon}
            strokeWidth={1.75}
            className="size-3.5"
            aria-hidden="true"
          />
          Paiement sécurisé par Flutterwave. Votre code secret n’est jamais
          demandé ici.
        </p>
      </div>
    </form>
  );
}
