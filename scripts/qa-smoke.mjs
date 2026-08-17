import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:5173";
const OUT = "C:\\Users\\MATTHIAS\\AppData\\Local\\Temp\\reminiscence-qa";
mkdirSync(OUT, { recursive: true });

const routes = [
  ["home", "#/"],
  ["plans", "#/plans"],
  ["plan-builder", "#/plans/new"],
  ["plan-edit", "#/plans/plan-1960s"],
  ["library", "#/library"],
  ["explore", "#/explore"],
  ["logs", "#/logs"],
  ["player", "#/player/plan-1960s"],
  ["media", "#/media/photo-001"]
];

const viewports = [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }]
];

const results = [];

function check(viewport, route, label, ok, detail = "") {
  results.push({ viewport, route, label, ok: !!ok, detail });
}

async function snapshotIssues(page, viewport, route) {
  const issues = await page.evaluate(() => {
    const out = [];
    const sel = "body *";
    const els = [...document.querySelectorAll(sel)];
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const style = getComputedStyle(el);
      if (style.position === "fixed" || style.position === "sticky") continue;
      const visible =
        r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0;
      if (!visible) continue;
      if (r.right > innerWidth + 2) {
        out.push(`h-overflow:${el.tagName}.${el.className?.toString().slice(0, 30)}`);
      }
    }
    return out.slice(0, 12);
  });
  return issues;
}

async function collectErrors(page, name) {
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  await page.goto(`${BASE}/${name}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  return errors;
}

async function runViewport(browser, viewportName, vp) {
  const context = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await context.newPage();

  for (const [routeName, hash] of routes) {
    const errors = await collectErrors(page, hash);
    const title = await page.title();
    const bodyText = await page.evaluate(() =>
      document.body.innerText.replace(/\s+/g, " ").trim().slice(0, 80)
    );
    check(viewportName, routeName, "load", bodyText.length > 40, `title=${title}`);
    check(viewportName, routeName, "console", errors.length === 0, errors.slice(0, 2).join(" | "));

    if (routeName === "home") {
      const stats = await page.evaluate(() =>
        Object.fromEntries(
          [...document.querySelectorAll(".stat-block")].map((el) => [
            el.querySelector("span")?.textContent?.trim(),
            el.querySelector("strong")?.textContent?.trim()
          ])
        )
      );
      const expected = { 歌曲: "30", 相片: "11", 影片: "3", 文字卡: "8" };
      const countsMatch = Object.entries(expected).every(
        ([label, count]) => stats[label] === count
      );
      check(
        viewportName,
        routeName,
        "starter-counts",
        countsMatch,
        JSON.stringify(stats)
      );
    }

    const issues = await snapshotIssues(page, viewportName, routeName);
    check(viewportName, routeName, "layout", issues.length === 0, issues.slice(0, 4).join(" | "));

    await page.screenshot({
      path: `${OUT}/${viewportName}-${routeName}.png`,
      fullPage: false
    });
  }

  // Interaction: explore filter, media detail back, plans -> builder, player controls.
  await page.goto(`${BASE}/#/explore`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const mediaCards = await page.locator("[data-testid='media-card'], .media-card, article").count();
  const filterButtons = page.locator("button, a, select, input");
  const filterNames = await filterButtons.allTextContents();
  const hasFilter = filterNames.some((t) => /相片|歌曲|影片/.test(t));
  check(viewportName, "explore", "filters", hasFilter, `cards=${mediaCards}`);
  const firstFilter = page.getByRole("button", { name: /相片/ }).first();
  if (await firstFilter.isVisible().catch(() => false)) {
    await firstFilter.click();
    await page.waitForTimeout(300);
    const photoCards = await page.getByText(/相片/).count();
    check(viewportName, "explore", "filter-action", photoCards > 0, `photoCount=${photoCards}`);
  }

  await page.goto(`${BASE}/#/player/plan-1960s`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const nextButton = page.getByRole("button", { name: "下一個" }).first();
  const position = page.locator(".player-position");
  const before = (await position.textContent()) || "";
  let playerProof = false;
  let after = "";
  if (await nextButton.isEnabled().catch(() => false)) {
    await nextButton.click();
    await page.waitForTimeout(400);
    after = (await position.textContent()) || "";
    playerProof = before !== after && /第 \d/.test(after);
  }
  check(viewportName, "player", "next-action", playerProof, `${before} -> ${after || ""}`);

  await page.goto(`${BASE}/#/plans/plan-1960s`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const saveButton = page.getByRole("button", { name: /儲存/ }).first();
  const planProof = (await page.getByText(/階段/).count()) > 0;
  check(viewportName, "plan-edit", "editor", planProof);
  if (await saveButton.isVisible().catch(() => false)) {
    await saveButton.click();
    await page.waitForTimeout(500);
    check(viewportName, "plan-edit", "save-action", true);
  }

  await context.close();
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
try {
  for (const [name, vp] of viewports) {
    await runViewport(browser, name, vp);
  }
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\nQA results: ${results.length - failed.length}/${results.length} passed`);
for (const r of failed) {
  console.log(`FAIL ${r.viewport} ${r.route} ${r.label}: ${r.detail}`);
}
if (!failed.length) console.log("All checks passed.");
