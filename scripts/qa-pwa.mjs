import { chromium } from "playwright-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://127.0.0.1:4173";

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

await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);

const manifestInfo = await page.evaluate(async () => {
  const link = document.querySelector('link[rel="manifest"]');
  if (!link) return { found: false };
  const response = await fetch(link.href);
  if (!response.ok) return { found: true, status: response.status };
  const manifest = await response.json();
  const icons = await Promise.all(
    (manifest.icons || []).slice(0, 4).map(async (icon) => ({
      src: icon.src,
      status: (await fetch(new URL(icon.src, location.origin))).status
    }))
  );
  return { found: true, status: response.status, name: manifest.name, icons };
});

check("manifest-linked", manifestInfo.found, JSON.stringify(manifestInfo));
check("manifest-ok", manifestInfo.status === 200, `status=${manifestInfo.status}`);
check(
  "icon-files-ok",
  manifestInfo.icons?.length > 0 && manifestInfo.icons.every((icon) => icon.status === 200),
  JSON.stringify(manifestInfo.icons)
);

await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(400);
check(
  "service-worker-controls-page",
  await page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
  `controller=${await page.evaluate(() => navigator.serviceWorker.controller?.state)}`
);
check(
  "app-shell-renders",
  (await page.getByText("憶當年").count()) > 0
);

await page.goto(`${BASE}/#/media/photo-001`, { waitUntil: "networkidle" });
await page.waitForFunction(() => {
  const img = document.querySelector('img[src*="photo-001"]');
  return img && img.complete && img.naturalWidth > 0;
});
check("online-media-loads", true);

await context.setOffline(true);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
await page.waitForFunction(() => {
  const img = document.querySelector('img[src*="photo-001"]');
  return img && img.complete && img.naturalWidth > 0;
});
check(
  "offline-reload-shows-media",
  true,
  `navigator.onLine=${await page.evaluate(() => navigator.onLine)}`
);

await page.goto(`${BASE}/#/plans`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
check(
  "offline-unvisited-route-renders",
  (await page.getByRole("heading", { name: /30 分鐘小組計劃/ }).count()) > 0
);
check(
  "offline-no-console-errors",
  errors.length === 0,
  errors.slice(0, 4).join(" | ")
);

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\nPWA QA: ${results.length - failed.length}/${results.length} passed`);
for (const r of failed) {
  console.log(`FAIL ${r.label}: ${r.detail}`);
}
if (!failed.length) console.log("All PWA checks passed.");
