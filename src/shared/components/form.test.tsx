import { expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ApiError } from "@/shared/errors/api-error";
import {
  applyApiFieldErrors,
  FormField,
  ValidatedForm,
  zodResolver,
} from "./form";
const schema = z.object({ label: z.string().min(1, "Libellé requis.") });
function Form({ submit }: { submit: () => Promise<void> }) {
  const form = useForm({
    defaultValues: { label: "" },
    resolver: zodResolver(schema),
    shouldFocusError: true,
  });
  return (
    <ValidatedForm
      form={form}
      onSubmit={async () => {
        try {
          await submit();
        } catch (error) {
          applyApiFieldErrors(error, form, ["label"]);
        }
      }}
    >
      <FormField name="label" label="Libellé" />
    </ValidatedForm>
  );
}
it("focuses validation errors, then prevents duplicate submissions", async () => {
  const user = userEvent.setup();
  let resolve: () => void = () => {};
  const submit = vi.fn(
    () =>
      new Promise<void>((done) => {
        resolve = done;
      }),
  );
  render(<Form submit={submit} />);
  await user.click(screen.getByRole("button", { name: "Valider" }));
  expect(screen.getByLabelText("Libellé")).toHaveFocus();
  expect(screen.getByText("Libellé requis.")).toBeVisible();
  await user.type(screen.getByLabelText("Libellé"), "test");
  await user.dblClick(screen.getByRole("button", { name: "Valider" }));
  expect(submit).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText("Libellé")).toBeDisabled();
  resolve();
  await waitFor(() => expect(screen.getByLabelText("Libellé")).toBeEnabled());
});
it("maps backend field names but does not render raw diagnostic text", async () => {
  const user = userEvent.setup();
  render(
    <Form
      submit={async () => {
        throw new ApiError("http", 400, {
          title: "Validation",
          status: 400,
          errors: [{ field: "label", message: "server-sensitive-value" }],
        });
      }}
    />,
  );
  await user.type(screen.getByLabelText("Libellé"), "test");
  await user.click(screen.getByRole("button", { name: "Valider" }));
  expect(await screen.findByText("Vérifiez ce champ.")).toBeVisible();
  await waitFor(() => expect(screen.getByLabelText("Libellé")).toHaveFocus());
  expect(screen.queryByText("server-sensitive-value")).not.toBeInTheDocument();
});
