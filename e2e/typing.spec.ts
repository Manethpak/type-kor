import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("typekor:test-skip-app-state") === "true") return;
    localStorage.setItem(
      "typekor:app-state",
      JSON.stringify({
        schemaVersion: 1,
        onboardingCompleted: true,
        lastExperience: "test",
      }),
    );
  });
});

async function enterText(page: import("@playwright/test").Page, text: string) {
  await page
    .locator("textarea[aria-label='Type the displayed Khmer text']")
    .evaluate((element, value) => {
      const textarea = element as HTMLTextAreaElement;
      textarea.dispatchEvent(
        new InputEvent("beforeinput", { bubbles: true, inputType: "insertText", data: value }),
      );
      textarea.value = value;
      textarea.dispatchEvent(
        new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }),
      );
    }, text);
}

async function enterTextWithoutBeforeInput(page: import("@playwright/test").Page, text: string) {
  await page
    .locator("textarea[aria-label='Type the displayed Khmer text']")
    .evaluate((element, value) => {
      const textarea = element as HTMLTextAreaElement;
      textarea.value = value;
      textarea.dispatchEvent(
        new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }),
      );
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

test("fades page chrome while keeping the active test progress visible", async ({ page }) => {
  await page.goto("/");
  await page.getByText("ចុចទីនេះ ហើយចាប់ផ្ដើមវាយ").click();

  await expect(page.locator("textarea")).toBeFocused();
  await expect(page.locator("header")).toHaveCSS("opacity", "0");
  await expect(page.locator("footer")).toHaveCSS("opacity", "0");
  await expect(page.getByTestId("time-progress")).toBeVisible();

  await page.locator("textarea").blur();
  await expect(page.locator("header")).toHaveCSS("opacity", "1");

  await page.getByRole("button", { name: "ពាក្យ" }).click();
  await expect(page.getByTestId("word-progress")).toContainText("/ 25 words");
});

test("switches and persists the typing difficulty", async ({ page }) => {
  await page.goto("/");
  const difficulty = page.getByRole("combobox", { name: "Word difficulty" });

  await expect(difficulty).toHaveValue("beginner");
  await difficulty.selectOption("mixed");
  await expect(difficulty).toHaveValue("mixed");
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("typekor:settings") ?? "{}")))
    .toMatchObject({ schemaVersion: 3, wordDifficulty: "mixed" });
});

test("backspace reopens the previous cluster when the capture buffer is empty", async ({
  page,
}) => {
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

test("accepts a Khmer zero-width word boundary in place of visible test space", async ({
  page,
}) => {
  await page.goto("/");
  const prompt = await page.locator("[data-cluster]").allTextContents();
  const boundaryIndex = prompt.indexOf(" ");
  expect(boundaryIndex).toBeGreaterThan(0);

  await enterText(page, prompt.slice(0, boundaryIndex).join(""));
  await expect(page.locator(`[data-cluster='${boundaryIndex}']`)).toHaveAttribute(
    "data-active",
    "true",
  );

  await enterText(page, "\u200B");

  await expect(page.locator(`[data-cluster='${boundaryIndex}']`)).toHaveAttribute(
    "data-state",
    "correct",
  );
  await expect(page.locator(`[data-cluster='${boundaryIndex + 1}']`)).toHaveAttribute(
    "data-active",
    "true",
  );
});

test("starts and completes the countdown when an input method omits beforeinput", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("typekor:settings", JSON.stringify({ mode: "time", modeValue: 1 }));
  });
  await page.goto("/");
  const firstCluster = page.locator("[data-cluster='0']");
  await enterTextWithoutBeforeInput(page, (await firstCluster.textContent())!);

  await expect(page.getByTestId("countdown")).toHaveText("1");
  await expect(page.getByRole("heading", { name: "ចង្វាក់នៃការវាយរបស់អ្នក" })).toBeVisible({
    timeout: 2_500,
  });
});

test("gives immediate prefix and error feedback without moving the cluster caret", async ({
  page,
}) => {
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
  await expect(page.getByRole("heading", { name: "ចង្វាក់នៃការវាយរបស់អ្នក" })).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: /Typing analytics chart: peak \d+ CPM, \d+ WPM, \d+% accuracy/,
    }),
  ).toBeVisible();
  await expect(page.getByText("Net cluster pace")).toBeVisible();
  await expect(page.getByText("Net word pace")).toBeVisible();
  await page.getByTitle("Local history").click();
  await expect(page.locator("article")).toHaveCount(1);
});

test("keeps corrected input errors in the final analytics", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "ពាក្យ" }).click();
  await page.getByRole("button", { name: "10", exact: true }).click();
  const prompt = await page.locator("[data-cluster]").allTextContents();
  const capture = page.locator("textarea[aria-label='Type the displayed Khmer text']");

  await enterText(page, "x");
  await capture.press("Backspace");
  await enterText(page, prompt.join(""));

  await expect(page.getByRole("heading", { name: "ចង្វាក់នៃការវាយរបស់អ្នក" })).toBeVisible();
  const inputErrors = await page
    .getByText("កំហុសពេលវាយ", { exact: true })
    .locator("xpath=following-sibling::dd")
    .textContent();
  expect(Number(inputErrors)).toBeGreaterThanOrEqual(1);
  await expect(
    page.getByText("ការកែ", { exact: true }).locator("xpath=following-sibling::dd"),
  ).toHaveText("1");
  await expect(page.getByText("Net cluster pace")).toBeVisible();
  await expect(page.getByText("Net word pace")).toBeVisible();
});

test("switches between the Saffron Ink and Rice Paper themes", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "saffron");
  await page.getByLabel("Toggle color theme").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "paper");
});

test("switches and persists the preferred speed unit", async ({ page }) => {
  await page.goto("/");
  await page.getByTitle("Settings").click();
  const unitSwitch = page.getByRole("group", { name: "Speed unit" });
  await expect(unitSwitch.getByRole("button", { name: "CPM" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await unitSwitch.getByRole("button", { name: "WPM" }).click();
  await expect(unitSwitch.getByRole("button", { name: "WPM" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("typekor:settings") ?? "{}")))
    .toMatchObject({ speedUnit: "wpm" });
});

test("routes with hash URLs and preserves the typing session across navigation", async ({
  page,
}) => {
  await page.goto("/");
  const firstCluster = page.locator("[data-cluster='0']");
  await enterText(page, (await firstCluster.textContent())!);
  await expect(firstCluster).toHaveAttribute("data-state", "correct");

  await page.getByTitle("Settings").click();
  await expect(page).toHaveURL(/#\/settings$/);
  await expect(page.getByRole("heading", { name: "ការកំណត់" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/#\/test$/);
  await expect(firstCluster).toHaveAttribute("data-state", "correct");
  await expect(page.locator("[data-cluster='1']")).toHaveAttribute("data-active", "true");
});

test("onboards into Learn and resumes the saved lesson step", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    sessionStorage.setItem("typekor:test-skip-app-state", "true");
    localStorage.removeItem("typekor:app-state");
    localStorage.removeItem("typekor:learning");
  });
  await page.reload();

  await expect(page.getByRole("heading", { name: "Type ក" })).toBeVisible();
  await page.getByRole("button", { name: /រៀន Learning mode/ }).click();
  await expect(page).toHaveURL(/#\/learn$/);
  await page.getByRole("button", { name: /Lesson 1\.1/ }).click();

  const firstInput = page.getByLabel("Type ក");
  await firstInput.evaluate((element) => {
    const textarea = element as HTMLTextAreaElement;
    textarea.value = "ក";
    textarea.dispatchEvent(
      new InputEvent("input", { bubbles: true, inputType: "insertText", data: "ក" }),
    );
  });
  await expect(page.getByLabel("Type ល")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Type ល")).toBeVisible();
});

test("grades Base and Shift Space as distinct lesson targets", async ({ page }) => {
  await page.goto("/#/learn/spacing-keys");

  await expect(page.getByText("ព្រំដែនពាក្យ ZWSP", { exact: true })).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByText("ចន្លោះធម្មតា", { exact: true })).toBeVisible();
  await page.keyboard.press("Shift+Space");
  await expect(page.getByText("ព្រំដែនពាក្យ ZWSP", { exact: true })).toBeVisible();
});
