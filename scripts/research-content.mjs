const API = "https://commons.wikimedia.org/w/api.php";

const searchCommons = async (term, type, limit = 15) => {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: `${term} filetype:${type}`,
    gsrnamespace: "6",
    gsrlimit: String(limit),
    prop: "imageinfo",
    iiprop: "url|mime|size|extmetadata",
    iiextmetadatafilter: "LicenseShortName|Artist|Credit|DateTimeOriginal"
  });
  const res = await fetch(`${API}?${params}`);
  if (!res.ok) throw new Error(`Commons ${res.status}`);
  const data = await res.json();
  const pages = Object.values(data.query?.pages || {});
  return pages
    .map((page) => {
      const meta = page.imageinfo?.[0] || {};
      const ext = meta.extmetadata || {};
      const clean = (value) =>
        String(value?.value || "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      return {
        title: page.title,
        license: clean(ext.LicenseShortName),
        artist: clean(ext.Artist),
        credit: clean(ext.Credit),
        date: clean(ext.DateTimeOriginal),
        mime: meta.mime,
        bytes: meta.size,
        duration: meta.duration,
        url: meta.url?.replace(/[?&]utm_[^&]*/g, ""),
        page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`
      };
    })
    .filter((item) => item.license);
};

const searchArchive = async (query, mediatype = "", rows = 20) => {
  const q = mediatype ? `${query} AND mediatype:${mediatype}` : query;
  const params = new URLSearchParams({
    q,
    rows: String(rows),
    page: "1",
    output: "json"
  });
  for (const field of ["identifier", "title", "mediatype", "licenseurl"]) {
    params.append("fl[]", field);
  }
  const res = await fetch(`https://archive.org/advancedsearch.php?${params}`);
  if (!res.ok) throw new Error(`Archive ${res.status}`);
  const data = await res.json();
  return data.response?.docs || [];
};

const [mode, ...args] = process.argv.slice(2);

if (mode === "commons") {
  const [type, ...rest] = args;
  console.log(JSON.stringify(await searchCommons(rest.join(" "), type), null, 2));
} else if (mode === "ia") {
  const [mediatype, ...rest] = args;
  console.log(JSON.stringify(await searchArchive(rest.join(" "), mediatype), null, 2));
} else {
  console.error("Usage: node scripts/research-content.mjs commons <audio|bitmap|video> <term>");
  console.error("       node scripts/research-content.mjs ia   <movies|audio|texts> <query>");
  process.exit(1);
}
