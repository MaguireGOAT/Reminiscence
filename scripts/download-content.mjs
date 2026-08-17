import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CONTENT_MANIFEST } from "./content-manifest.mjs";

const ROOT = new URL("../", import.meta.url);
const manifestOutput = new URL("./public/content-manifest.json", ROOT);
const sourceMap = new Map(CONTENT_MANIFEST.map((entry) => [entry.sourceDownload, entry]));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sleepAfter = async () => {
  await delay(900 + Math.round(Math.random() * 500));
};

const downloadWithRetry = async (url, attempts = 8) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response;
    try {
      response = await fetch(url, {
        headers: {
          "User-Agent":
            "ReminiscencePWA-Content-Pipeline/1.0 (non-commercial facilitator demo)"
        }
      });
    } catch (error) {
      if (attempt === attempts) throw error;
      await delay(4000 * attempt);
      continue;
    }
    if (response.ok) return Buffer.from(await response.arrayBuffer());
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") || 0);
      const wait = Number.isFinite(retryAfter) ? retryAfter : 30;
      if (attempt === attempts) throw new Error(`429 after ${attempts} attempts`);
      await delay((wait + 5 + attempt * 5) * 1000);
      continue;
    }
    throw new Error(`${response.status} ${response.statusText}`);
  }
  throw new Error("unreachable");
};

const targetPath = (entry) => {
  const target = new URL(`./public/media/${entry.localFile}`, ROOT);
  if (target.href.includes("..")) throw new Error(`Unsafe target: ${entry.localFile}`);
  return fileURLToPath(target);
};

const writeManifest = (entries) => {
  const out = entries.map((entry) => ({
    id: entry.localFile
      .replace("real-photos/", "photo-")
      .replace("real-songs/", "song-")
      .replace("real-videos/", "video-")
      .replace(/\.\w+$/, ""),
    type: entry.kind,
    localFile: `/media/${entry.localFile}`,
    title: entry.title,
    year: entry.year || "",
    decade: entry.decade || "",
    place: entry.place || "",
    theme: entry.theme || "",
    duration: entry.duration || null,
    sourceCredit: entry.sourceCredit,
    sourceTitle: entry.sourceTitle,
    license: entry.license,
    sourceUrl: entry.sourceUrl,
    sourceDownload: entry.sourceDownload,
    bytes: entry.bytes
  }));
  writeFileSync(manifestOutput, JSON.stringify(out, null, 2), "utf8");
};

const completed = [];
let downloaded = 0;
let copied = 0;
let skipped = 0;
let failed = 0;
const failedEntries = [];

for (const entry of CONTENT_MANIFEST) {
  const path = targetPath(entry);
  mkdirSync(dirname(path), { recursive: true });
  const existing = await import("node:fs").then((fs) => {
    try {
      return fs.statSync(path);
    } catch {
      return null;
    }
  });

  if (existing && existing.size > 0) {
    skipped += 1;
    completed.push(entry);
    console.log(`KEEP ${entry.localFile} (${existing.size.toLocaleString()} bytes)`);
  } else {
    const prior = sourceMap.get(entry.sourceDownload);
    const priorPath = prior ? targetPath(prior) : null;
    const priorStat = priorPath
      ? await import("node:fs").then((fs) => {
          try {
            return fs.statSync(priorPath);
          } catch {
            return null;
          }
        })
      : null;

    if (priorStat && priorStat.size > 0 && priorPath !== path) {
      try {
        copyFileSync(priorPath, path);
        copied += 1;
        completed.push(entry);
        console.log(`COPY ${entry.localFile} <- ${prior.localFile}`);
      } catch (error) {
        failed += 1;
        failedEntries.push(entry);
        console.error(`COPY FAIL ${entry.localFile}: ${error.message}`);
      }
    } else {
      try {
        const buffer = await downloadWithRetry(entry.sourceDownload);
        writeFileSync(path, buffer);
        downloaded += 1;
        completed.push(entry);
        console.log(`OK   ${entry.localFile} (${buffer.length.toLocaleString()} bytes)`);
      } catch (error) {
        failed += 1;
        failedEntries.push(entry);
        console.error(`FAIL ${entry.localFile}: ${error.message}`);
      }
    }
  }

  writeManifest(completed);
  console.log(`...${completed.length}/${CONTENT_MANIFEST.length} in manifest`);
  await sleepAfter();
}

console.log(
  `\nDownload complete: ${downloaded} downloaded, ${copied} copied, ${skipped} skipped, ${failed} failed.`
);
if (failedEntries.length) {
  console.log(`Failed: ${failedEntries.map((entry) => entry.localFile).join(", ")}`);
}
