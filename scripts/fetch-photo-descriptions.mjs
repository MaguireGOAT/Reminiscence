import { CONTENT_MANIFEST } from "./content-manifest.mjs";

const API = "https://commons.wikimedia.org/w/api.php";
const titles = [
  ...new Set(
    CONTENT_MANIFEST.filter((entry) => entry.kind === "photo").map(
      (entry) => `File:${entry.sourceTitle}`
    )
  )
];

const clean = (value) =>
  String(value?.value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const rows = [];
for (let index = 0; index < titles.length; index += 20) {
  const batch = titles.slice(index, index + 20);
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    titles: batch.join("|"),
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiextmetadatafilter: "ImageDescription|ObjectName|Categories|DateTimeOriginal"
  });
  const response = await fetch(`${API}?${params}`);
  if (!response.ok) throw new Error(`Commons ${response.status}`);
  const data = await response.json();
  rows.push(
    ...(data.query?.pages || []).map((page) => {
      const ext = page.imageinfo?.[0]?.extmetadata || {};
      const categories = String(ext.Categories?.value || "")
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean)
        .join(", ");
      return {
        title: page.title.replace(/^File:/, ""),
        description: clean(ext.ImageDescription),
        objectName: clean(ext.ObjectName),
        categories,
        date: clean(ext.DateTimeOriginal)
      };
    })
  );
  await new Promise((resolve) => setTimeout(resolve, 150));
}

console.log(JSON.stringify(rows, null, 2));
