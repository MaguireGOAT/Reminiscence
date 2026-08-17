const API = "https://commons.wikimedia.org/w/api.php";

const titles = process.argv.slice(2);
const fetchInfo = async (batch) => {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    titles: batch.join("|"),
    prop: "imageinfo",
    iiprop: "url|mime|size|duration|extmetadata",
    iiextmetadatafilter: "LicenseShortName|Artist|Credit|DateTimeOriginal"
  });
  const res = await fetch(`${API}?${params}`);
  if (!res.ok) throw new Error(`Commons ${res.status}`);
  const data = await res.json();
  return (data.query?.pages || []).map((page) => {
    const meta = page.imageinfo?.[0] || {};
    const ext = meta.extmetadata || {};
    const clean = (value) =>
      String(value?.value || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    return {
      title: page.title,
      missing: page.missing === true,
      license: clean(ext.LicenseShortName),
      artist: clean(ext.Artist),
      credit: clean(ext.Credit) || clean(ext.Artist),
      date: clean(ext.DateTimeOriginal),
      mime: meta.mime,
      bytes: meta.size,
      duration: meta.duration,
      url: meta.url?.replace(/[?&]utm_[^&]*/g, ""),
      page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`
    };
  });
};

const batchSize = 20;
const results = [];
for (let i = 0; i < titles.length; i += batchSize) {
  const batch = titles.slice(i, i + batchSize).map((title) => (title.startsWith("File:") ? title : `File:${title}`));
  results.push(...(await fetchInfo(batch)));
  await new Promise((resolve) => setTimeout(resolve, 150));
}

console.log(JSON.stringify(results, null, 2));
