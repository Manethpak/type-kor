# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: typing.spec.ts >> switches and persists the preferred speed unit
- Location: e2e/typing.spec.ts:208:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/
Call log:
  - navigating to "http://127.0.0.1:4173/", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "This site can’t be reached" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - strong [ref=e9]: 127.0.0.1
      - text: refused to connect.
    - generic [ref=e10]:
      - paragraph [ref=e11]: "Try:"
      - list [ref=e12]:
        - listitem [ref=e13]: Checking the connection
        - listitem [ref=e14]:
          - link "Checking the proxy and the firewall" [ref=e15] [cursor=pointer]:
            - /url: "#buttons"
    - generic [ref=e16]: ERR_CONNECTION_REFUSED
  - generic [ref=e17]:
    - button "Reload" [ref=e19] [cursor=pointer]
    - button "Details" [ref=e20] [cursor=pointer]
```

# Test source

```ts
  109 |     "data-active",
  110 |     "true",
  111 |   );
  112 | 
  113 |   await enterText(page, "\u200B");
  114 | 
  115 |   await expect(page.locator(`[data-cluster='${boundaryIndex}']`)).toHaveAttribute(
  116 |     "data-state",
  117 |     "correct",
  118 |   );
  119 |   await expect(page.locator(`[data-cluster='${boundaryIndex + 1}']`)).toHaveAttribute(
  120 |     "data-active",
  121 |     "true",
  122 |   );
  123 | });
  124 | 
  125 | test("starts and completes the countdown when an input method omits beforeinput", async ({
  126 |   page,
  127 | }) => {
  128 |   await page.addInitScript(() => {
  129 |     localStorage.setItem("typekor:settings", JSON.stringify({ mode: "time", modeValue: 1 }));
  130 |   });
  131 |   await page.goto("/");
  132 |   const firstCluster = page.locator("[data-cluster='0']");
  133 |   await enterTextWithoutBeforeInput(page, (await firstCluster.textContent())!);
  134 | 
  135 |   await expect(page.getByTestId("countdown")).toHaveText("1");
  136 |   await expect(page.getByText("លទ្ធផលរបស់អ្នក")).toBeVisible({ timeout: 2_500 });
  137 | });
  138 | 
  139 | test("gives immediate prefix and error feedback without moving the cluster caret", async ({
  140 |   page,
  141 | }) => {
  142 |   await page.goto("/");
  143 |   const prompt = await page.locator("[data-cluster]").allTextContents();
  144 |   const targetIndex = prompt.findIndex((cluster) => Array.from(cluster).length > 1);
  145 |   expect(targetIndex).toBeGreaterThanOrEqual(0);
  146 | 
  147 |   await enterText(page, prompt.slice(0, targetIndex).join(""));
  148 |   const targetCluster = page.locator(`[data-cluster='${targetIndex}']`);
  149 |   const firstCodePoint = Array.from(prompt[targetIndex])[0];
  150 |   await enterText(page, firstCodePoint);
  151 |   await expect(page.getByTestId("attempt-feedback")).toHaveAttribute("data-status", "prefix");
  152 |   await expect(page.getByTestId("attempt-feedback")).toContainText(firstCodePoint);
  153 |   await expect(targetCluster).toHaveAttribute("data-active", "true");
  154 | 
  155 |   await enterText(page, "x");
  156 |   await expect(page.getByTestId("attempt-feedback")).toHaveAttribute("data-status", "incorrect");
  157 |   await expect(page.getByTestId("attempt-feedback")).toContainText("x");
  158 |   await expect(targetCluster).toHaveAttribute("data-active", "true");
  159 | });
  160 | 
  161 | test("completes a deterministic word test and stores the result locally", async ({ page }) => {
  162 |   await page.goto("/");
  163 |   await page.getByRole("button", { name: "ពាក្យ" }).click();
  164 |   await page.getByRole("button", { name: "10", exact: true }).click();
  165 |   const prompt = await page.locator("[data-cluster]").allTextContents();
  166 |   await enterText(page, prompt.join(""));
  167 |   await expect(page.getByText("លទ្ធផលរបស់អ្នក")).toBeVisible();
  168 |   await expect(
  169 |     page.getByRole("img", {
  170 |       name: /Typing analytics chart: peak \d+ CPM, \d+ WPM, \d+% accuracy/,
  171 |     }),
  172 |   ).toBeVisible();
  173 |   await expect(page.getByText("Net cluster pace")).toBeVisible();
  174 |   await expect(page.getByText("Net word pace")).toBeVisible();
  175 |   await page.getByTitle("Local history").click();
  176 |   await expect(page.locator("article")).toHaveCount(1);
  177 | });
  178 | 
  179 | test("keeps corrected input errors in the final analytics", async ({ page }) => {
  180 |   await page.goto("/");
  181 |   await page.getByRole("button", { name: "ពាក្យ" }).click();
  182 |   await page.getByRole("button", { name: "10", exact: true }).click();
  183 |   const prompt = await page.locator("[data-cluster]").allTextContents();
  184 |   const capture = page.locator("textarea[aria-label='Type the displayed Khmer text']");
  185 | 
  186 |   await enterText(page, "x");
  187 |   await capture.press("Backspace");
  188 |   await enterText(page, prompt.join(""));
  189 | 
  190 |   await expect(page.getByText("លទ្ធផលរបស់អ្នក")).toBeVisible();
  191 |   await expect(
  192 |     page.getByText("កំហុសពេលវាយ", { exact: true }).locator("xpath=following-sibling::dd"),
  193 |   ).toHaveText("1");
  194 |   await expect(
  195 |     page.getByText("ការកែ", { exact: true }).locator("xpath=following-sibling::dd"),
  196 |   ).toHaveText("1");
  197 |   await expect(page.getByText("Net cluster pace")).toBeVisible();
  198 |   await expect(page.getByText("Net word pace")).toBeVisible();
  199 | });
  200 | 
  201 | test("switches between the Saffron Ink and Rice Paper themes", async ({ page }) => {
  202 |   await page.goto("/");
  203 |   await expect(page.locator("html")).toHaveAttribute("data-theme", "saffron");
  204 |   await page.getByLabel("Toggle color theme").click();
  205 |   await expect(page.locator("html")).toHaveAttribute("data-theme", "paper");
  206 | });
  207 | 
  208 | test("switches and persists the preferred speed unit", async ({ page }) => {
> 209 |   await page.goto("/");
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/
  210 |   await page.getByTitle("Settings").click();
  211 |   const unitSwitch = page.getByRole("group", { name: "Speed unit" });
  212 |   await expect(unitSwitch.getByRole("button", { name: "CPM" })).toHaveAttribute(
  213 |     "aria-pressed",
  214 |     "true",
  215 |   );
  216 |   await unitSwitch.getByRole("button", { name: "WPM" }).click();
  217 |   await expect(unitSwitch.getByRole("button", { name: "WPM" })).toHaveAttribute(
  218 |     "aria-pressed",
  219 |     "true",
  220 |   );
  221 |   await expect
  222 |     .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("typekor:settings") ?? "{}")))
  223 |     .toMatchObject({ speedUnit: "wpm" });
  224 | });
  225 | 
  226 | test("routes with hash URLs and preserves the typing session across navigation", async ({
  227 |   page,
  228 | }) => {
  229 |   await page.goto("/");
  230 |   const firstCluster = page.locator("[data-cluster='0']");
  231 |   await enterText(page, (await firstCluster.textContent())!);
  232 |   await expect(firstCluster).toHaveAttribute("data-state", "correct");
  233 | 
  234 |   await page.getByTitle("Settings").click();
  235 |   await expect(page).toHaveURL(/#\/settings$/);
  236 |   await expect(page.getByRole("heading", { name: "ការកំណត់" })).toBeVisible();
  237 | 
  238 |   await page.goBack();
  239 |   await expect(page).toHaveURL(/#\/test$/);
  240 |   await expect(firstCluster).toHaveAttribute("data-state", "correct");
  241 |   await expect(page.locator("[data-cluster='1']")).toHaveAttribute("data-active", "true");
  242 | });
  243 | 
  244 | test("onboards into Learn and resumes the saved lesson step", async ({ page }) => {
  245 |   await page.goto("/");
  246 |   await page.evaluate(() => {
  247 |     localStorage.removeItem("typekor:app-state");
  248 |     localStorage.removeItem("typekor:learning");
  249 |   });
  250 |   await page.reload();
  251 | 
  252 |   await expect(page.getByRole("heading", { name: "Typing ភាសាខ្មែរជាមួយក្ដារចុច NIDA" })).toBeVisible();
  253 |   await page.getByRole("button", { name: /រៀន Learning mode/ }).click();
  254 |   await expect(page).toHaveURL(/#\/learn$/);
  255 |   await page.getByRole("button", { name: /ក · ល · ស · ហ/ }).click();
  256 | 
  257 |   const firstInput = page.getByLabel("Type ក");
  258 |   await firstInput.evaluate((element) => {
  259 |     const textarea = element as HTMLTextAreaElement;
  260 |     textarea.value = "ក";
  261 |     textarea.dispatchEvent(
  262 |       new InputEvent("input", { bubbles: true, inputType: "insertText", data: "ក" }),
  263 |     );
  264 |   });
  265 |   await expect(page.getByLabel("Type ល")).toBeVisible();
  266 | 
  267 |   await page.reload();
  268 |   await expect(page.getByLabel("Type ល")).toBeVisible();
  269 | });
  270 | 
```