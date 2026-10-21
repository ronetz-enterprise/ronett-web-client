import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  SmartPhone01Icon,
  SquareLock02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
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
import { usePaymentChannels } from "../hooks/use-purchase";
import {
  COUNTRY_CODE,
  formatLocalNumber,
  paymentFormSchema,
  type PaymentFormValues,
} from "../model/mobile-money";
import {
  findChannel,
  guessChannel,
  type PaymentChannel,
} from "../model/payment-channel";

/** Logo de l'opérateur ; l'icône téléphone le remplace s'il manque ou ne charge pas. */
export function ChannelLogo({
  channel,
  className,
}: {
  channel: Pick<PaymentChannel, "logoUrl"> | undefined;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const box = cn(
    "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white",
    className,
  );
  if (!channel?.logoUrl || broken)
    return (
      <span className={cn(box, "bg-muted text-muted-foreground")}>
        <HugeiconsIcon
          icon={SmartPhone01Icon}
          strokeWidth={1.75}
          className="size-4"
          aria-hidden="true"
        />
      </span>
    );
  return (
    <span className={box}>
      <img
        src={channel.logoUrl}
        alt=""
        width={36}
        height={36}
        className="size-full object-contain"
        onError={() => setBroken(true)}
      />
    </span>
  );
}

/**
 * Liste des moyens de paiement : un appui choisit le moyen et passe à l'écran suivant.
 */
export function ChannelList({
  onSelect,
}: {
  onSelect: (channelId: string) => void;
}) {
  const channels = usePaymentChannels();
  return (
    <ul className="divide-y overflow-hidden rounded-xl border border-border/70 bg-card shadow-[0_1px_2px_0_rgb(0_0_0/0.05),0_2px_4px_-2px_rgb(0_0_0/0.06)]">
      {channels.map((channel) => (
        <li key={channel.id}>
          <button
            type="button"
            onClick={() => onSelect(channel.id)}
            className="group flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors outline-none hover:bg-muted/40 focus-visible:bg-muted/60"
          >
            <ChannelLogo channel={channel} className="size-10" />
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block font-medium">{channel.label}</span>
              <span className="block text-xs text-muted-foreground">
                {channel.status === "DEGRADED"
                  ? "Lenteurs possibles en ce moment"
                  : "Validation sur votre téléphone"}
              </span>
            </span>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={2}
              aria-hidden="true"
              className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}

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
  channelId: fixedChannelId,
  onSubmit,
}: {
  submitLabel: string;
  pending: boolean;
  error?: string | null;
  defaultValues?: Partial<PaymentFormValues>;
  withEmail?: boolean;
  /** Moyen déjà choisi sur un écran précédent : la liste des opérateurs n'est pas affichée. */
  channelId?: string;
  onSubmit: (values: PaymentFormValues) => void;
}) {
  const id = useId();
  const online = useOnline();
  const channels = usePaymentChannels();
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      phone: "",
      email: "",
      ...defaultValues,
      // Un achat d'avant les canaux garde le code opérateur : on le ramène au canal correspondant.
      channelId:
        findChannel(channels, fixedChannelId ?? defaultValues?.channelId)?.id ??
        "",
    },
  });
  const { errors } = form.formState;
  const channelId = form.watch("channelId");
  const degraded = findChannel(channels, channelId)?.status === "DEGRADED";
  const phone = form.register("phone");
  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={form.handleSubmit((values) => {
        if (!pending) onSubmit(values);
      })}
    >
      {!fixedChannelId && (
        <fieldset
          className="space-y-2"
          aria-describedby={`${id}-network-error`}
        >
          <legend className="mb-2 text-sm font-medium">Opérateur</legend>
          <div className="grid gap-2">
            {channels.map((channel) => {
              const checked = channelId === channel.id;
              return (
                <label
                  key={channel.id}
                  className={cn(
                    "relative flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border bg-card px-3 py-3 text-sm shadow-[0_1px_2px_0_rgb(0_0_0/0.04)] transition-[border-color,background-color] duration-200 has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50",
                    checked
                      ? "border-primary bg-primary/5"
                      : "border-border/70 hover:border-primary/40",
                  )}
                >
                  <input
                    type="radio"
                    value={channel.id}
                    {...form.register("channelId")}
                    className="sr-only"
                  />
                  <ChannelLogo channel={channel} className="size-10" />
                  <span className="min-w-0 flex-1 leading-tight font-medium">
                    {channel.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background",
                    )}
                  >
                    {checked && (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        strokeWidth={2.5}
                        className="size-3"
                      />
                    )}
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
            {errors.channelId?.message}
          </p>
          {degraded && (
            <p className="text-sm text-muted-foreground">
              Cet opérateur connaît des lenteurs : la demande peut mettre plus
              de temps à arriver.
            </p>
          )}
        </fieldset>
      )}

      <div className="space-y-2">
        <label htmlFor={`${id}-phone`} className="text-sm font-medium">
          Numéro à débiter
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
              const guess = guessChannel(channels, formatted);
              if (guess && !form.getValues("channelId"))
                form.setValue("channelId", guess, {
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
