import { chromium } from "playwright-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:5173";

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

const findings = [];
function report(viewport, route, group, detail) {
  findings.push({ viewport, route, group, detail });
}

async function auditPage(page, viewportName, routeName) {
  const pageInfo = await page.evaluate(() => ({
    scrollY: Math.round(scrollY),
    hash: location.hash,
    innerHeight,
    docBottom: document.documentElement.scrollHeight
  }));
  const issues = await page.evaluate(() => {
    const out = [];
    const add = (group, detail) => out.push(`${group}: ${detail}`);
    const atBottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;

    // Text clipped horizontally inside its own box.
    for (const el of document.querySelectorAll("body *")) {
      if (el.children.length && el.scrollWidth > el.clientWidth + 2) {
        const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30);
        if (text && getComputedStyle(el).overflowX === "hidden") {
          add("text-clip", `${el.tagName}.${el.className?.toString().slice(0, 20)} "${text}"`);
        }
      }
    }

    // Whole-document horizontal overflow.
    if (document.documentElement.scrollWidth > innerWidth + 2) {
      add("doc-h-overflow", `${document.documentElement.scrollWidth} > ${innerWidth}`);
    }

    // Fixed elements that escape the viewport (e.g. bottom bars).
    for (const el of document.querySelectorAll("body *")) {
      const style = getComputedStyle(el);
      if (style.position !== "fixed" && style.position !== "sticky") continue;
      const r = el.getBoundingClientRect();
      if (r.left < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) {
        add("fixed-escape", `${el.tagName}.${el.className?.toString().slice(0, 20)}`);
      }
    }

    // Controls hidden under a fixed bottom bar after scrolling to the end.
    const fixed = [...document.querySelectorAll("body *")].filter((el) => {
      const style = getComputedStyle(el);
      return (style.position === "fixed" || style.position === "sticky") &&
        el.getBoundingClientRect().top >= innerHeight * 0.5;
    });
    const navRect = fixed
      .map((el) => el.getBoundingClientRect())
      .reduce((best, r) => (r.height > (best?.height || 0) ? r : best), null);
    if (navRect && atBottom) {
      for (const el of document.querySelectorAll("button,a,input,select,textarea,[tabindex]")) {
        const r = el.getBoundingClientRect();
        const visible = r.top < innerHeight && r.bottom > 0;
        if (!visible || r.height === 0) continue;
        const overlap =
          r.bottom > navRect.top + 4 &&
          r.bottom <= innerHeight &&
          r.left < navRect.right - 8 &&
          r.right > navRect.left + 8;
        if (overlap) {
          const style = getComputedStyle(el);
          const insideNav = el.closest && el.closest(".bottom-nav, .side-nav, .topbar");
          if (!insideNav && style.position !== "fixed" && style.position !== "sticky") {
            const label = (el.textContent || el.getAttribute("aria-label") || el.tagName)
              .trim().replace(/\s+/g, " ").slice(0, 24);
            add("control-behind-nav", `${el.tagName} "${label}"`);
          }
        }
      }
    }

    // Media element health.
    for (const img of document.querySelectorAll("img")) {
      const r = img.getBoundingClientRect();
      if (r.width > 1 && r.height > 1 && img.complete && img.naturalWidth === 0) {
        add("broken-img", img.src.slice(0, 70));
      }
    }
    for (const video of document.querySelectorAll("video")) {
      if (video.readyState === 0 && video.getAttribute("src")) {
        add("unloaded-video", video.getAttribute("src"));
      }
    }
    for (const audio of document.querySelectorAll("audio")) {
      if (audio.readyState === 0 && audio.getAttribute("src")) {
        add("unloaded-audio", audio.getAttribute("src"));
      }
    }

    // Text overlapping other non-decorative content.
    const textEls = [...document.querySelectorAll("h1,h2,h3,h4,strong,p,span,label,button,a")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        if (!(r.width > 12 && r.height > 6 && (el.textContent || "").trim())) return false;
        let parent = el.parentElement;
        while (parent) {
          const style = getComputedStyle(parent);
          if (style.position === "fixed" || style.position === "sticky") return false;
          parent = parent.parentElement;
        }
        return true;
      });
    for (let i = 0; i < textEls.length; i += 1) {
      const a = textEls[i].getBoundingClientRect();
      if (a.top < 0 || a.left < 0) continue;
      for (let j = i + 1; j < textEls.length; j += 1) {
        const b = textEls[j].getBoundingClientRect();
        if (b.top < 0 || b.left < 0) continue;
        if (a.width === 0 || b.width === 0) continue;
        const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        if (overlapX > 0.55 * Math.min(a.width, b.width) && overlapY > 0.45 * Math.min(a.height, b.height)) {
          const nested =
            textEls[i].contains(textEls[j]) || textEls[j].contains(textEls[i]);
          if (!nested) {
            const ta = (textEls[i].textContent || "").trim().replace(/\s+/g, " ").slice(0, 20);
            const tb = (textEls[j].textContent || "").trim().replace(/\s+/g, " ").slice(0, 20);
            add("text-overlap", `"${ta}" x "${tb}"`);
          }
        }
      }
    }
    return out.slice(0, 20);
  });

  for (const issue of issues) {
    const [group, detail] = [issue.slice(0, issue.indexOf(":")), issue.slice(issue.indexOf(":") + 1)];
    report(viewportName, routeName, group, detail);
  }
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
try {
  for (const [viewportName, vp] of viewports) {
    const context = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
    const page = await context.newPage();
    for (const [routeName, hash] of routes) {
      await page.goto(`${BASE}/${hash}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(700);
      await auditPage(page, viewportName, routeName);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(200);
      await auditPage(page, viewportName, `${routeName}@bottom`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}

const groups = [...new Set(findings.map((f) => f.group))];
console.log(`Findings: ${findings.length}`);
for (const group of groups) {
  const rows = findings.filter((f) => f.group === group);
  console.log(`\n## ${group} (${rows.length})`);
  for (const r of rows.slice(0, 8)) {
    console.log(`  ${r.viewport} ${r.route}: ${r.detail}`);
  }
}
