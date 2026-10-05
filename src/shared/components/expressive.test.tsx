import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import {
  formatBytes,
  formatMoney,
  formatRelative,
} from "@/shared/utils/format";
import { Amount } from "./amount";
import { CopyableId } from "./copyable-id";
import { DataToolbar } from "./data-toolbar";
import { DetailTabs } from "./detail-tabs";
import { EmptyState } from "./feedback";
import { KeyValueList } from "./key-value-list";
import { Meter } from "./meter";
import { StatTile } from "./stat-tile";
import { StatusDot } from "./status-dot";
import { SuccessMoment } from "./success-moment";
import { Timeline } from "./timeline";

describe("formats", () => {
  it("formats francs without decimals and bytes in decimal units", () => {
    expect(formatMoney(1500, "XAF").replace(/\s/g, " ")).toMatch(/1 500\sFCFA/);
    expect(formatBytes(1_500_000)).toBe("1,5 Mo");
  });

  it("formats relative times", () => {
    const now = Date.parse("2026-10-01T10:00:00Z");
    expect(formatRelative("2026-10-01T09:59:40Z", now)).toBe("à l’instant");
    expect(formatRelative("2026-10-01T09:57:00Z", now)).toContain("3");
  });
});

it("StatusDot shows its label and a live halo only when requested", () => {
  const { container, rerender } = render(
    <StatusDot label="En ligne" tone="success" live />,
  );
  expect(screen.getByText("En ligne")).toBeVisible();
  expect(container.querySelector(".motion-safe\\:animate-ping")).not.toBeNull();
  rerender(<StatusDot label="Hors ligne" tone="danger" />);
  expect(container.querySelector(".motion-safe\\:animate-ping")).toBeNull();
});

it("Meter exposes its value and switches tone near the limit", () => {
  const { rerender } = render(<Meter label="Données" value={50} max={100} />);
  const meter = screen.getByRole("meter", { name: "Données" });
  expect(meter).toHaveAttribute("aria-valuenow", "50");
  expect(meter.firstElementChild).toHaveClass("bg-chart-3");
  rerender(<Meter label="Données" value={97} max={100} />);
  expect(screen.getByRole("meter").firstElementChild).toHaveClass(
    "bg-danger-foreground",
  );
  rerender(<Meter label="Données" value={10} max={null} />);
  expect(screen.getByText("Illimité")).toBeVisible();
});

it("StatTile announces the exact value and the direction of change", () => {
  render(
    <MemoryRouter>
      <StatTile
        label="Revenu"
        value={1500}
        format={(v) => formatMoney(v, "XAF")}
        delta={0.12}
        trend={[1, 3, 2, 5]}
      />
    </MemoryRouter>,
  );
  expect(screen.getByText("Revenu")).toBeVisible();
  expect(screen.getByText(/en hausse/)).toBeInTheDocument();
  expect(
    screen.getByText(
      (_, el) =>
        el?.className === "sr-only" && /1\s500/.test(el.textContent ?? ""),
    ),
  ).toBeInTheDocument();
});

it("Amount signs balance effects with semantic tones only", () => {
  render(<Amount value={-500} currency="XAF" signed />);
  const amount = screen.getByText(/−/);
  expect(amount).toHaveClass("text-danger-foreground");
});

it("CopyableId copies the value and confirms it", async () => {
  // userEvent installe son propre presse-papiers : le faux doit être posé après.
  const user = userEvent.setup();
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  render(<CopyableId value="trf_123" label="identifiant du transfert" />);
  await user.click(
    screen.getByRole("button", { name: "Copier l’identifiant du transfert" }),
  );
  expect(writeText).toHaveBeenCalledWith("trf_123");
  expect(await screen.findByText("Copié")).toBeInTheDocument();
});

it("DetailTabs follows the URL and navigates on click", async () => {
  function Where() {
    return <p data-testid="path">{useLocation().pathname}</p>;
  }
  render(
    <MemoryRouter initialEntries={["/sites/1/settings"]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <DetailTabs
                label="Site"
                tabs={[
                  { label: "Informations", to: "/sites/1" },
                  { label: "Paramètres", to: "/sites/1/settings" },
                  { label: "Secret", to: "/sites/1/secret", hidden: true },
                ]}
              />
              <Where />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.getByRole("tab", { name: "Paramètres" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(screen.queryByRole("tab", { name: "Secret" })).toBeNull();
  await userEvent
    .setup()
    .click(screen.getByRole("tab", { name: "Informations" }));
  expect(screen.getByTestId("path")).toHaveTextContent("/sites/1");
});

it("DataToolbar searches, removes filters and announces the count", async () => {
  const onSearch = vi.fn();
  const onRemove = vi.fn();
  render(
    <DataToolbar
      onSearch={onSearch}
      active={[{ key: "s", label: "Site : Douala", onRemove }]}
      count={2}
    />,
  );
  await userEvent
    .setup()
    .type(screen.getByRole("searchbox", { name: "Rechercher" }), "a");
  expect(onSearch).toHaveBeenCalledWith("a");
  await userEvent
    .setup()
    .click(
      screen.getByRole("button", { name: "Retirer le filtre Site : Douala" }),
    );
  expect(onRemove).toHaveBeenCalled();
  expect(screen.getByRole("status")).toHaveTextContent("2 résultats");
});

it("Timeline marks upcoming steps", () => {
  render(
    <Timeline
      events={[
        { id: "1", title: "Demandé", at: "2026-10-01T10:00:00Z" },
        { id: "2", title: "Versé", upcoming: true },
      ]}
    />,
  );
  expect(screen.getByText("(à venir)")).toBeInTheDocument();
});

it("KeyValueList renders definition pairs", () => {
  render(<KeyValueList items={[{ label: "Ville", value: "Douala" }]} />);
  expect(screen.getByText("Ville").tagName).toBe("DT");
  expect(screen.getByText("Douala").tagName).toBe("DD");
});

it("EmptyState keeps its plain form and adds an illustrated variant", () => {
  const { container, rerender } = render(<EmptyState title="Aucun site" />);
  expect(container.querySelector("[data-slot=icon-tile]")).toBeNull();
  rerender(<EmptyState title="Aucun site" objectType="site" />);
  expect(container.querySelector("[data-slot=icon-tile]")).not.toBeNull();
});

it("SuccessMoment is announced", () => {
  render(<SuccessMoment title="Première vente !" />);
  expect(screen.getByRole("status")).toHaveTextContent("Première vente !");
});
