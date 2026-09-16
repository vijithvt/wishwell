import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("template artwork, editor, export, persistence and mobile", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".template-card")).toHaveCount(10);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map((i) => i.decode()));
  });
  await page.screenshot({ path: "docs/studio-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Floral", exact: true }).click();
  await expect(page.locator(".template-card")).toHaveCount(3);
  await page
    .getByRole("button", { name: "All templates", exact: true })
    .click();
  await page.locator(".template-card").first().click();
  await page.getByLabel("Display name").fill("Maya Iyer");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG" }).click();
  const dl = await downloadPromise;
  await dl.saveAs("docs/sample-poster.png");
  const bytes = await readFile("docs/sample-poster.png");
  expect(bytes.readUInt32BE(16)).toBe(1080);
  expect(bytes.readUInt32BE(20)).toBe(1080);
  await page.getByLabel("Canvas size").selectOption("portrait");
  const portraitDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG" }).click();
  await (await portraitDownload).saveAs("docs/sample-portrait.png");
  const portrait = await readFile("docs/sample-portrait.png");
  expect(portrait.readUInt32BE(16)).toBe(1080);
  expect(portrait.readUInt32BE(20)).toBe(1350);
  await page.getByRole("button", { name: "Save poster", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("saved");
  await page.reload();
  await page.getByRole("button", { name: /Saved posters/ }).click();
  await expect(page.locator(".saved-card").first()).toBeVisible();
  await page
    .getByRole("button", { name: "People & birthdays", exact: true })
    .click();
  await page.getByRole("button", { name: "Add person", exact: true }).click();
  await page.getByLabel("Full name").fill("Test Musician");
  await page.getByLabel("Date of birth").fill("2010-02-28");
  await page.getByRole("button", { name: "Save person", exact: true }).click();
  await expect(page.getByText("Test Musician", { exact: true })).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "People & birthdays", exact: true })
    .click();
  await expect(page.getByText("Test Musician", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Delete Test Musician", exact: true })
    .click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Test Musician", { exact: true })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Template library", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.screenshot({ path: "docs/studio-mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("brand persistence, organization quotes and uploaded images", async ({
  page,
  request,
}) => {
  const original = await (await request.get("/api/brand")).json();
  try {
    await page.goto("/");
    await page
      .getByRole("button", { name: "Brand settings", exact: true })
      .click();
    await page.getByLabel("Company or academy name").fill("Acme Creative");
    await page.getByLabel("Organization type").selectOption("company");
    await page
      .getByLabel("Upload company logo")
      .setInputFiles("docs/sample-poster.png");
    await expect(
      page.locator('.brand-preview img[alt="Company logo"]'),
    ).toBeVisible();
    await page.getByRole("button", { name: "Save brand settings" }).click();
    await expect(page.getByRole("status")).toContainText("saved");
    await page.reload();
    await page
      .getByRole("button", { name: "Brand settings", exact: true })
      .click();
    await expect(page.getByLabel("Company or academy name")).toHaveValue(
      "Acme Creative",
    );
    await page.getByRole("button", { name: "Open poster editor" }).click();
    await expect(page.getByLabel("Birthday wish")).toContainText(
      "new possibilities",
    );
    await page
      .getByLabel("Upload portrait")
      .setInputFiles("docs/sample-poster.png");
    await expect(page.locator(".preview-fit .poster-photo img")).toBeVisible();
    await page.getByLabel("Auto quote").uncheck();
    await page.getByLabel("Birthday wish").fill("Keep making beautiful music.");
    await expect(page.locator(".preview-fit .poster-quote")).toHaveText(
      "Keep making beautiful music.",
    );
  } finally {
    await request.put("/api/brand", { data: original });
  }
});
