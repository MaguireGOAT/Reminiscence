import { chromium } from "playwright-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:5173";
const OUT = "C:\\Users\\MATTHIAS\\AppData\\Local\\Temp\\reminiscence-qa";

const results = [];

function check(label, ok, detail = "") {
  results.push({ label, ok: !!ok, detail });
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

const goto = async (hash) => {
  await page.goto(`${BASE}/${hash}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
};

await goto("#/player/plan-1960s");

const position = async () => (await page.locator(".player-position").textContent()) || "";
const firstPosition = await position();
check(
  "player-loads",
  /第 \d+ \/ \d+ 張/.test(firstPosition),
  `position=${firstPosition}`
);

const repeatBefore = await page.getByRole("button", { name: "重播歌曲" }).count();
check("repeat-hidden-on-text-card", repeatBefore === 0, `repeatButtons=${repeatBefore}`);

await page.keyboard.press("ArrowRight");
await page.waitForTimeout(400);
const afterArrowRight = await position();
check(
  "arrow-right-moves-to-song",
  afterArrowRight.startsWith("第 2 /"),
  `${firstPosition} -> ${afterArrowRight}`
);

const repeatButton = page.getByRole("button", { name: "重播歌曲" });
check("repeat-visible-on-song", (await repeatButton.count()) === 1);
if (await repeatButton.count()) {
  await repeatButton.click();
  await page.waitForTimeout(200);
  const pressedOn = await repeatButton.getAttribute("aria-pressed");
  await repeatButton.click();
  await page.waitForTimeout(200);
  const pressedOff = await repeatButton.getAttribute("aria-pressed");
  check(
    "repeat-toggle",
    pressedOn === "true" && pressedOff === "false",
    `on=${pressedOn} off=${pressedOff}`
  );
}

await page.keyboard.press("ArrowLeft");
await page.waitForTimeout(300);
const afterArrowLeft = await position();
check(
  "arrow-left-returns",
  afterArrowLeft.startsWith("第 1 /"),
  `${afterArrowRight} -> ${afterArrowLeft}`
);

await page.keyboard.press("ArrowRight");
await page.waitForTimeout(300);
const revealButton = page.locator(".control-bar").getByRole("button", { name: "顯示答案" });
await revealButton.click();
const overlay = page.getByRole("dialog", { name: "問題" });
await overlay.waitFor({ state: "visible" });
await page.screenshot({ path: `${OUT}/mobile-player-overlay.png` });

const revealedRows = await overlay.locator(".recall-option-correct").count();
check("reveal-opens-answer", revealedRows > 0, `correctRows=${revealedRows}`);

const hideAnswer = overlay.getByRole("button", { name: "隱藏答案" });
check("answer-starts-revealed", (await hideAnswer.count()) === 1);
if (await hideAnswer.count()) {
  await hideAnswer.click();
  await page.waitForTimeout(200);
  check(
    "answer-can-hide",
    (await overlay.getByRole("button", { name: "顯示答案" }).count()) === 1 &&
      (await overlay.locator(".recall-option-correct").count()) === 0
  );
}

await page.keyboard.press("Escape");
await page.waitForTimeout(300);
check("escape-closes-overlay", (await page.getByRole("dialog", { name: "問題" }).count()) === 0);

await goto("#/");
const prepButton = page.getByRole("button", { name: "準備離線" }).first();
await prepButton.click();
const prepModal = page.getByRole("dialog").filter({ hasText: "準備離線" });
await prepModal.waitFor({ state: "visible" });
check("offline-modal-opens", true);

await prepModal.getByRole("button", { name: "開始下載" }).click();
await page.waitForSelector(".prep-success", { timeout: 20000 });
await page.screenshot({ path: `${OUT}/mobile-offline-prep.png` });
check("offline-prep-completes", (await prepModal.locator(".prep-success").count()) === 1);

await prepModal.getByRole("button", { name: "完成" }).click();
await page.waitForTimeout(300);
check(
  "offline-modal-closes",
  (await page.getByRole("dialog").filter({ hasText: "準備離線" }).count()) === 0
);

await goto("#/media/video-001");
await page.waitForSelector("video[src*='video-001']");
await page.waitForTimeout(500);
const videoBefore = await page
  .locator("video[src*='video-001']")
  .evaluate((video) => ({
    paused: video.paused,
    time: video.currentTime,
    readyState: video.readyState
  }));
check(
  "video-loads-paused",
  videoBefore.paused && videoBefore.readyState > 0,
  JSON.stringify(videoBefore)
);

if (await page.getByRole("button", { name: "播放影片" }).isVisible().catch(() => false)) {
  await page.getByRole("button", { name: "播放影片" }).click();
  await page.waitForTimeout(900);
  const videoAfter = await page
    .locator("video[src*='video-001']")
    .evaluate((video) => ({ paused: video.paused, time: video.currentTime }));
  check(
    "video-plays-on-tap",
    !videoAfter.paused && videoAfter.time > 0,
    JSON.stringify(videoAfter)
  );
} else {
  check("video-plays-on-tap", false, "video play button not visible");
}

await goto("#/logs");
await page.evaluate(() => {
  window.__printCalled = false;
  window.print = () => {
    window.__printCalled = true;
  };
});
const pdfButton = page.getByRole("button", { name: "匯出 PDF" });
check("pdf-export-button-visible", (await pdfButton.count()) === 1);
if (await pdfButton.count()) {
  await pdfButton.click();
  await page.waitForTimeout(250);
  const pdfState = await page.evaluate(() => ({
    printCalled: window.__printCalled,
    printSheetCount: document.querySelectorAll(".print-sheet").length,
    printSheetText: document.querySelector(".print-sheet")?.innerText?.slice(0, 40) || "",
    printSheetDisplay: document.querySelector(".print-sheet")
      ? getComputedStyle(document.querySelector(".print-sheet")).display
      : ""
  }));
  check(
    "pdf-export-opens-print-sheet",
    pdfState.printCalled &&
      pdfState.printSheetCount === 1 &&
      pdfState.printSheetDisplay === "none",
    JSON.stringify(pdfState)
  );
  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(150);
  const printMediaState = await page.evaluate(() => ({
    sheetDisplay: getComputedStyle(document.querySelector(".print-sheet")).display,
    pageHeaderDisplay: getComputedStyle(document.querySelector(".logs-page .page-header")).display,
    logListDisplay: getComputedStyle(document.querySelector(".logs-page .log-list")).display
  }));
  await page.screenshot({ path: `${OUT}/mobile-pdf-export.png` });
  check(
    "pdf-print-layout",
    printMediaState.sheetDisplay === "block" &&
      printMediaState.pageHeaderDisplay === "none" &&
      printMediaState.logListDisplay === "none",
    JSON.stringify(printMediaState)
  );
  await page.emulateMedia({ media: "screen" });

  const csvDownload = page.waitForEvent("download", { timeout: 5000 });
  await page.getByRole("button", { name: "匯出 CSV" }).click();
  const csvFile = await csvDownload;
  check(
    "csv-export-downloads",
    csvFile.suggestedFilename().endsWith(".csv"),
    csvFile.suggestedFilename()
  );
}

check("no-console-errors", errors.length === 0, errors.slice(0, 3).join(" | "));

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\nInteraction QA: ${results.length - failed.length}/${results.length} passed`);
for (const r of failed) {
  console.log(`FAIL ${r.label}: ${r.detail}`);
}
if (!failed.length) console.log("All interaction checks passed.");
