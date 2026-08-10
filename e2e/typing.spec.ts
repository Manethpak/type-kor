import { expect, test } from "@playwright/test";

async function enterText(page: import("@playwright/test").Page, text: string) {
  await page.locator("textarea[aria-label='Type the displayed Khmer text']").evaluate((element, value) => {
    const textarea = element as HTMLTextAreaElement;
    textarea.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, inputType: "insertText", data: value }));
    textarea.value = value;
    textarea.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
  }, text);
}

async function enterTextWithoutBeforeInput(page: import("@playwright/test").Page, text: string) {
  await page.locator("textarea[aria-label='Type the displayed Khmer text']").evaluate((element, value) => {
    const textarea = element as HTMLTextAreaElement;
    textarea.value = value;
    textarea.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
  }, text);
}

test("focuses the real input and advances one Khmer cluster", async ({ page }) => {
  await page.goto("/");
  const firstCluster = page.locator("[data-cluster='0']");
  const value = await firstCluster.textContent();
  await page.getByText("ចុចទីនេះ ហើយចាប់ផ្ដើមវាយ").click();
  await expect(page.locator("textarea")).toBeFocused();
  await enterText(page, value!);
  await expect(firstCluster).toHaveAttribute("data-state", "correct");
  await expect(page.locator("[data-cluster='1']")).toHaveAttribute("data-active", "true");
});

test("backspace reopens the previous cluster when the capture buffer is empty", async ({ page }) => {
  await page.goto("/");
  const firstCluster = page.locator("[data-cluster='0']");
  const value = await firstCluster.textContent();
  await enterText(page, value!);
  await expect(page.locator("[data-cluster='1']")).toHaveAttribute("data-active", "true");

  const capture = page.locator("textarea[aria-label='Type the displayed Khmer text']");
  await capture.press("Backspace");

  await expect(firstCluster).toHaveAttribute("data-active", "true");
  await expect(firstCluster).toHaveAttribute("data-state", "pending");
  await expect(capture).toHaveValue(Array.from(value!).slice(0, -1).join(""));
});

test("accepts a Khmer zero-width word boundary in place of visible test space", async ({ page }) => {
  await page.goto("/");
  const prompt = await page.locator("[data-cluster]").allTextContents();
  const boundaryIndex = prompt.indexOf(" ");
  expect(boundaryIndex).toBeGreaterThan(0);

  await enterText(page, prompt.slice(0, boundaryIndex).join(""));
  await expect(page.locator(`[data-cluster='${boundaryIndex}']`)).toHaveAttribute("data-active", "true");

  await enterText(page, "\u200B");

  await expect(page.locator(`[data-cluster='${boundaryIndex}']`)).toHaveAttribute("data-state", "correct");
  await expect(page.locator(`[data-cluster='${boundaryIndex + 1}']`)).toHaveAttribute("data-active", "true");
});

test("starts and completes the countdown when an input method omits beforeinput", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("typkh:settings", JSON.stringify({ mode: "time", modeValue: 1 }));
  });
  await page.goto("/");
  const firstCluster = page.locator("[data-cluster='0']");
  await enterTextWithoutBeforeInput(page, (await firstCluster.textContent())!);

  await expect(page.getByTestId("countdown")).toHaveText("1");
  await expect(page.getByText("លទ្ធផលរបស់អ្នក")).toBeVisible({ timeout: 2_500 });
});

test("gives immediate prefix and error feedback without moving the cluster caret", async ({ page }) => {
  await page.goto("/");
  const prompt = await page.locator("[data-cluster]").allTextContents();
  const targetIndex = prompt.findIndex((cluster) => Array.from(cluster).length > 1);
  expect(targetIndex).toBeGreaterThanOrEqual(0);

  await enterText(page, prompt.slice(0, targetIndex).join(""));
  const targetCluster = page.locator(`[data-cluster='${targetIndex}']`);
  const firstCodePoint = Array.from(prompt[targetIndex])[0];
  await enterText(page, firstCodePoint);
  await expect(page.getByTestId("attempt-feedback")).toHaveAttribute("data-status", "prefix");
  await expect(page.getByTestId("attempt-feedback")).toContainText(firstCodePoint);
  await expect(targetCluster).toHaveAttribute("data-active", "true");

  await enterText(page, "x");
  await expect(page.getByTestId("attempt-feedback")).toHaveAttribute("data-status", "incorrect");
  await expect(page.getByTestId("attempt-feedback")).toContainText("x");
  await expect(targetCluster).toHaveAttribute("data-active", "true");
});

test("completes a deterministic word test and stores the result locally", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "ពាក្យ" }).click();
  await page.getByRole("button", { name: "10", exact: true }).click();
  const prompt = await page.locator("[data-cluster]").allTextContents();
  await enterText(page, prompt.join(""));
  await expect(page.getByText("លទ្ធផលរបស់អ្នក")).toBeVisible();
  await expect(page.getByRole("img", { name: /Per-second typing speed chart, peak \d+ cpm/ })).toBeVisible();
  await page.getByRole("group", { name: "Result speed unit" }).getByRole("button", { name: "wpm" }).click();
  await expect(page.getByRole("img", { name: /Per-second typing speed chart, peak \d+ wpm/ })).toBeVisible();
  await page.getByTitle("Local history").click();
  await expect(page.locator("article")).toHaveCount(1);
});

test("switches between the Saffron Ink and Rice Paper themes", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "saffron");
  await page.getByLabel("Toggle color theme").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "paper");
});

test("switches the live speed display between CPM and WPM", async ({ page }) => {
  await page.goto("/");
  const unitSwitch = page.getByRole("group", { name: "Speed unit" });
  await expect(unitSwitch.getByRole("button", { name: "cpm" })).toHaveAttribute("aria-pressed", "true");
  await unitSwitch.getByRole("button", { name: "wpm" }).click();
  await expect(unitSwitch.getByRole("button", { name: "wpm" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("live-speed").locator("xpath=following-sibling::small")).toHaveText("wpm");
});

test("routes with hash URLs and preserves the typing session across navigation", async ({ page }) => {
  await page.goto("/");
  const firstCluster = page.locator("[data-cluster='0']");
  await enterText(page, (await firstCluster.textContent())!);
  await expect(firstCluster).toHaveAttribute("data-state", "correct");

  await page.getByTitle("Settings").click();
  await expect(page).toHaveURL(/#\/settings$/);
  await expect(page.getByRole("heading", { name: "ការកំណត់" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/(?:#\/)?$/);
  await expect(firstCluster).toHaveAttribute("data-state", "correct");
  await expect(page.locator("[data-cluster='1']")).toHaveAttribute("data-active", "true");
});
