import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { FormField } from "./form";
export function PasswordField({
  name = "password",
  label = "Mot de passe",
  autoComplete = "current-password",
}: {
  name?: string;
  label?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <FormField
      name={name}
      label={label}
      type={visible ? "text" : "password"}
      autoComplete={autoComplete}
      endAdornment={
        <button
          type="button"
          aria-pressed={visible}
          aria-label={`${visible ? "Masquer" : "Afficher"} ${label.toLowerCase()}`}
          title={visible ? "Masquer" : "Afficher"}
          onClick={() => setVisible(!visible)}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <HugeiconsIcon
            icon={visible ? ViewOffIcon : ViewIcon}
            strokeWidth={1.75}
            className="size-4"
          />
        </button>
      }
    />
  );
}
