import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
const org = "/app/00000000-0000-4000-8000-000000000001";
test("accessible shell in light and dark, mobile focus and text zoom", async ({
  page,
}, testInfo) => {
  await page.goto(org);
  await expect(
    page.getByRole("button", { name: "Basculer la navigation" }),
  ).toBeEnabled();
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    await expect(page.locator("html")).toHaveClass(
      colorScheme === "dark" ? /dark/ : "",
    );
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  }
  await page.emulateMedia({ colorScheme: "light" });
  await page.screenshot({
    path: testInfo.outputPath("desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 640 });
  await page.getByRole("button", { name: "Basculer la navigation" }).click();
  await expect(page.getByRole("dialog", { name: "Navigation" })).toBeVisible();
  const mobile = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(mobile.violations).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("mobile.png"),
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Basculer la navigation" }),
  ).toBeFocused();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("accessible public, auth and confirmation views", async ({ page }) => {
  for (const path of ["/public", "/auth/login", "/__dev/socle"]) {
    await page.goto(path);
    if (path === "/__dev/socle") {
      await expect(
        page.getByRole("button", { name: "Simuler une erreur technique" }),
      ).toBeEnabled();
      await page
        .getByRole("button", { name: "Tester la confirmation" })
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();
    }
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
  }
});
