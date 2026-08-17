const identifiers = process.argv.slice(2);

const fetchJson = async (url) => {
  const res = await fetch(url, {
    headers: { "User-Agent": "ReminiscencePWA-Content-Research/1.0" }
  });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
};

for (const identifier of identifiers) {
  try {
    const data = await fetchJson(`https://archive.org/metadata/${identifier}`);
    const meta = (data.metadata || {});
    const files = (data.files || [])
      .filter((file) => file.format === "MP3" || file.format === "VBR MP3" || file.format === "128Kbps MP3")
      .map((file) => ({
        name: file.name,
        format: file.format,
        size: file.size,
        length: file.length
      }));
    console.log(`\n## ${identifier}: ${meta.title || ""}`);
    console.log(
      `license: ${meta.licenseurl || meta.rights || "未標明"} | collections: ${
        Array.isArray(meta.collection) ? meta.collection.join(", ") : meta.collection || ""
      }`
    );
    if (meta.description) {
      const text = String(Array.isArray(meta.description) ? meta.description.join(" ") : meta.description)
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      console.log(`description: ${text.slice(0, 2000)}`);
    }
    try {
      const res = await fetch(
        `https://archive.org/download/${identifier}/${identifier}_meta.xml`,
        { headers: { "User-Agent": "ReminiscencePWA-Content-Research/1.0" } }
      );
      const xml = res.ok ? await res.text() : "";
      for (const key of ["licenseurl", "rights", "license", "access_restricted"]) {
        const needle = `<${key}>`;
        const hits = [...xml.matchAll(new RegExp(`${needle}([^<]*)<\\/${key}>`, "g"))]
          .map((match) => match[1])
          .filter(Boolean);
        if (hits.length) console.log(`meta.${key}: ${hits.join(" | ")}`);
      }
    } catch {
      // The meta.xml may not exist for every item; metadata JSON is enough.
    }
    for (const file of files) {
      console.log(
        `${file.name}\t${file.format || ""}\t${file.length || ""}s\t${file.size || 0}`
      );
    }
  } catch (error) {
    console.error(`ERROR ${identifier}: ${error.message}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
}
