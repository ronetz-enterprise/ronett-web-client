import { useState } from "react";
import { FormField } from "./form";
import { Button } from "@/shared/ui/button";
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
    <div className="space-y-2">
      <FormField
        name={name}
        label={label}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
      />
      <Button
        type="button"
        variant="outline"
        aria-pressed={visible}
        onClick={() => setVisible(!visible)}
      >
        {visible ? "Masquer" : "Afficher"} {label.toLowerCase()}
      </Button>
    </div>
  );
}
