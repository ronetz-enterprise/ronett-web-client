import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-xl border px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative sm:has-data-[slot=alert-action]:pr-44 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      /** Bandeaux : fond teinté pâle, texte de même teinte, sans ombre. */
      variant: {
        default: "border-border bg-surface text-foreground",
        info: "border-info-foreground/15 bg-info text-info-foreground *:data-[slot=alert-description]:text-info-foreground/85",
        success:
          "border-success-foreground/15 bg-success text-success-foreground *:data-[slot=alert-description]:text-success-foreground/85",
        warning:
          "border-warning-foreground/15 bg-warning text-warning-foreground *:data-[slot=alert-description]:text-warning-foreground/85",
        destructive:
          "border-danger-border bg-danger text-danger-foreground *:data-[slot=alert-description]:text-danger-foreground/85",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-semibold group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn(
        "col-span-full mt-2 sm:absolute sm:top-1/2 sm:right-3 sm:col-auto sm:mt-0 sm:-translate-y-1/2",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
