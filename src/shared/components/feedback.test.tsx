import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/shared/errors/api-error";
import { TechnicalError, CorrelationIdDisplay } from "./feedback";
import { ErrorBoundary } from "./error-boundary";
import { SensitiveValue } from "./sensitive-value";
import { ConfirmDialog } from "./confirm-dialog";
it("renders a safe technical error and correlation", () => {
  render(
    <TechnicalError
      error={
        new ApiError(
          "http",
          500,
          { title: "secret", status: 500, detail: "secret" },
          "original-id",
        )
      }
    />,
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "temporairement indisponible",
  );
  expect(screen.getByText("original-id")).toBeVisible();
  expect(screen.queryByText("secret")).not.toBeInTheDocument();
});
it("copies the exact correlation and reports failure accessibly", async () => {
  const user = userEvent.setup();
  const copy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
  render(<CorrelationIdDisplay correlationId="Original-ID" />);
  await user.click(screen.getByRole("button", { name: "Copier la référence" }));
  expect(copy).toHaveBeenCalledWith("Original-ID");
  expect(screen.getByRole("status")).toHaveTextContent("Référence copiée");
  copy.mockRejectedValue(new Error());
  await user.click(screen.getByRole("button", { name: "Copier la référence" }));
  expect(screen.getByRole("status")).toHaveTextContent("Copie indisponible");
});
it("catches component errors without exposing the stack", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  function Broken(): never {
    throw new Error("sensitive-stack");
  }
  render(
    <ErrorBoundary>
      <Broken />
    </ErrorBoundary>,
  );
  expect(screen.getByRole("alert")).toBeVisible();
  expect(screen.queryByText(/sensitive-stack/)).not.toBeInTheDocument();
});
it("reveals and copies sensitive values only after explicit actions", async () => {
  const user = userEvent.setup();
  const copy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
  render(<SensitiveValue value="fixture-only-value" />);
  expect(screen.queryByText("fixture-only-value")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Révéler" }));
  expect(screen.getByText("fixture-only-value")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Copier la valeur" }));
  expect(copy).toHaveBeenCalledWith("fixture-only-value");
  await user.click(screen.getByRole("button", { name: "Masquer" }));
  expect(screen.queryByText("fixture-only-value")).not.toBeInTheDocument();
  expect(localStorage.length).toBe(0);
});
it("opens an accessible confirmation and closes with Escape", async () => {
  const user = userEvent.setup();
  const confirm = vi.fn().mockResolvedValue(undefined);
  render(
    <ConfirmDialog
      trigger="Ouvrir"
      title="Confirmer ?"
      description="Une opération de test."
      onConfirm={confirm}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Ouvrir" }));
  expect(screen.getByRole("dialog", { name: "Confirmer ?" })).toBeVisible();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(confirm).not.toHaveBeenCalled();
});
