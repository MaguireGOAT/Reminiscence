import { writeFileSync } from "node:fs";
import { CONTENT_MANIFEST } from "./content-manifest.mjs";

const out = CONTENT_MANIFEST.map((entry) => ({
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

writeFileSync(new URL("../public/content-manifest.json", import.meta.url), JSON.stringify(out, null, 2), "utf8");
console.log(`Generated public/content-manifest.json with ${out.length} entries.`);
