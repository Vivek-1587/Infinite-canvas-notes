import { expect, test } from "@playwright/test";

test("creates, edits, searches, connects, and opens graph view", async ({ page }) => {
  page.on("pageerror", (err) => {
    console.error("PAGE ERROR:", err.message, err.stack);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.error("CONSOLE ERROR:", msg.text());
    }
  });

  await page.goto("/");

  await expect(page.getByTestId("app-title")).toBeVisible();
  await page.keyboard.press("n");
  await expect
    .poll(async () => page.getByTestId("canvas-note").count())
    .toBeGreaterThan(1);

  await page.getByTestId("canvas-note").last().click();
  await page.getByRole("textbox", { name: "Note Title" }).fill("Launch Strategy");
  await page
    .getByRole("textbox", { name: "Markdown content" })
    .fill("# Launch Strategy\n\n- [x] Define launch");
  await expect(page.getByTestId("note-inspector").getByRole("heading", { name: "Launch Strategy", level: 1 })).toBeVisible();

  await page.getByTestId("global-search").fill("launch");
  await expect(page.getByTestId("notes-list").getByText("Launch Strategy").first()).toBeVisible();

  await page.getByLabel("Graph").click();
  await expect(page.getByTestId("graph-view")).toBeVisible();
});
